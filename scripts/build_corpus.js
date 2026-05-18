// Build script: node scripts/build_corpus.js <inputPath> [--dry-run]
// Generates src/data/${basename}_corpus.json from a structured regulation JSON.
//
// --dry-run: skips embedding API calls, writes corpus with embedding: [] arrays.
//            Use to verify chunking shape before spending API credits.

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Tokenizer — must stay byte-identical to src/llm/rag/tokenizer.ts
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'not','no','nor','so','yet','both','either','neither','each','few','more',
  'most','other','some','such','than','that','these','they','this','those',
  'as','its','it','he','she','we','you','i','me','him','her','us','them',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputPath = args.find(a => !a.startsWith('--'));

if (!inputPath) {
  console.error('Usage: node scripts/build_corpus.js <inputPath> [--dry-run]');
  process.exit(1);
}

const basename = path.basename(inputPath, '.json');
const outputPath = path.join('src', 'data', `${basename}_corpus.json`);
const partialPath = outputPath + '.partial.json';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!dryRun && !OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY is required (set in environment or .env.local)');
  process.exit(1);
}

const EMBEDDING_MODEL = 'google/gemini-embedding-2-preview';
const BATCH_SIZE = 32;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Document loading
// ---------------------------------------------------------------------------
function loadDocument(filePath) {
  console.log(`Loading ${filePath} ...`);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Text parsing — supports two paragraph styles found in the regulation:
//   Style A (inline):    "(1) text (2) text"  — Article 3 style
//   Style B (line-start): " 1.   text\n 2.   text" — Article 14 style
// Sub-points always use (a), (b), ... inline within a paragraph's text.
// ---------------------------------------------------------------------------

// Split text into paragraphs. Returns array of { num: string, text: string }.
function splitParagraphs(text) {
  const paragraphs = [];

  // Style B: lines starting with optional whitespace + digit(s) + dot + spaces
  const styleBRegex = /(?:^|\n)\s*(\d+)\.\s{2,}([\s\S]*?)(?=\n\s*\d+\.\s{2,}|$)/g;
  let matchB;
  const styleBMatches = [];
  const textCopy = text;
  while ((matchB = styleBRegex.exec(textCopy)) !== null) {
    styleBMatches.push({ num: matchB[1], text: matchB[2].trim() });
  }

  if (styleBMatches.length > 0) {
    return styleBMatches;
  }

  // Style A: "(N)" markers anywhere in text
  const styleARegex = /\((\d+)\)\s+([\s\S]*?)(?=\(\d+\)\s+|$)/g;
  let matchA;
  while ((matchA = styleARegex.exec(text)) !== null) {
    paragraphs.push({ num: matchA[1], text: matchA[2].trim() });
  }

  if (paragraphs.length > 0) {
    return paragraphs;
  }

  // Fallback: whole text as paragraph 1
  return [{ num: '1', text: text.trim() }];
}

// Split a paragraph's text into sub-points.
// Returns { lead: string, subPoints: Array<{ letter: string, text: string }> }.
//
// Only treats (letter) markers as sub-points when they form a strict alphabetic
// sequence starting at (a). This correctly excludes roman numeral sub-sub-points
// like (i), (ii), (iv), (x) that appear nested inside (a), (b), etc.
function splitSubPoints(paragraphText) {
  // Find all single-letter paren markers and their positions
  const allMatches = [...paragraphText.matchAll(/\(([a-z])\)\s+/g)];

  // Filter to only those forming a strict ascending sequence from 'a'
  // e.g. a→b→c is valid; a→i (skipping b,c,...,h) means (i) is a roman numeral
  const validMatches = [];
  let nextExpected = 0; // 'a' = 0, 'b' = 1, ...
  for (const m of allMatches) {
    const idx = m[1].charCodeAt(0) - 97; // 'a'=0
    if (validMatches.length === 0) {
      if (idx === 0) { // must start with (a)
        validMatches.push(m);
        nextExpected = 1;
      }
    } else if (idx === nextExpected) {
      validMatches.push(m);
      nextExpected++;
    }
    // else: out-of-sequence letter (roman numeral sub-sub-point) — skip
  }

  if (validMatches.length === 0) {
    return { lead: paragraphText, subPoints: [] };
  }

  const lead = paragraphText.slice(0, validMatches[0].index).trim();
  const subPoints = validMatches.map((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < validMatches.length ? validMatches[i + 1].index : paragraphText.length;
    return { letter: m[1], text: paragraphText.slice(start, end).trim() };
  });

  return { lead, subPoints };
}

// ---------------------------------------------------------------------------
// Chunk building
// ---------------------------------------------------------------------------
function articleNum(articleId) {
  // "Article 3" → "3", "Article 10" → "10"
  return articleId.replace(/^Article\s+/i, '').replace(/\s+/g, '_');
}

function buildChunks(article) {
  const children = [];
  const parents = [];

  const chapter = Object.keys(article.metadata || {}).find(k => /^CHAPTER /i.test(k));
  const section = Object.keys(article.metadata || {}).find(k => /^SECTION /i.test(k));
  const chapterVal = chapter ? article.metadata[chapter] : undefined;
  const sectionVal = section ? article.metadata[section] : undefined;

  const artNum = articleNum(article.id);
  const header = `[${article.id}: ${article.title}]`;

  const paragraphs = splitParagraphs(article.text || '');

  for (const para of paragraphs) {
    const parentChunkId = `art${artNum}_p${para.num}`;
    const parentFullPath = `${article.id} § ${para.num}`;

    const { lead, subPoints } = splitSubPoints(para.text);

    // Build parent chunk — full paragraph text
    const parentText = `${header} (${para.num}) ${para.text}`;
    parents.push({
      chunk_id: parentChunkId,
      article_id: article.id,
      article_title: article.title,
      ...(chapterVal && { chapter: chapterVal }),
      ...(sectionVal && { section: sectionVal }),
      paragraph: para.num,
      full_path: parentFullPath,
      text: parentText,
    });

    if (subPoints.length === 0) {
      // No sub-points — emit one child chunk for the whole paragraph
      children.push({
        chunk_id: parentChunkId,
        parent_id: parentChunkId,
        article_id: article.id,
        article_title: article.title,
        ...(chapterVal && { chapter: chapterVal }),
        ...(sectionVal && { section: sectionVal }),
        paragraph: para.num,
        full_path: parentFullPath,
        text: parentText,
        embedding: [],
      });
    } else {
      for (const sp of subPoints) {
        const childChunkId = `art${artNum}_p${para.num}_${sp.letter}`;
        const childFullPath = `${article.id} § ${para.num}(${sp.letter})`;
        const childText = lead
          ? `${header} (${para.num}) ${lead}\n(${sp.letter}) ${sp.text}`
          : `${header} (${para.num}) (${sp.letter}) ${sp.text}`;

        children.push({
          chunk_id: childChunkId,
          parent_id: parentChunkId,
          article_id: article.id,
          article_title: article.title,
          ...(chapterVal && { chapter: chapterVal }),
          ...(sectionVal && { section: sectionVal }),
          paragraph: para.num,
          sub_point: sp.letter,
          full_path: childFullPath,
          text: childText,
          embedding: [],
        });
      }
    }
  }

  return { children, parents };
}

// ---------------------------------------------------------------------------
// BM25 IDF pre-computation
// ---------------------------------------------------------------------------
function computeBM25Idf(children) {
  const N = children.length;
  const df = {};
  const doclen = {};

  for (const child of children) {
    const tokens = tokenize(child.text);
    doclen[child.chunk_id] = tokens.length;
    const seen = new Set(tokens);
    for (const t of seen) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  const avgdl = Object.values(doclen).reduce((s, l) => s + l, 0) / N;

  const idf = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log((N - freq + 0.5) / (freq + 0.5) + 1);
  }

  return { idf, avgdl, doclen };
}

// ---------------------------------------------------------------------------
// Embedding via OpenRouter
// ---------------------------------------------------------------------------
async function embedBatch(texts, retries = 0) {
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (res.status === 429 || res.status >= 500) {
    if (retries >= MAX_RETRIES) throw new Error(`Embedding API failed after ${MAX_RETRIES} retries: ${res.status}`);
    const delay = Math.pow(2, retries) * 1000;
    console.log(`  Rate limited (${res.status}), retrying in ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
    return embedBatch(texts, retries + 1);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  if (!json.data) {
    throw new Error(`Unexpected embedding response: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json.data.map(d => d.embedding);
}

async function embedChunks(children) {
  // Load partial progress if it exists
  let startBatch = 0;
  if (fs.existsSync(partialPath)) {
    const partial = JSON.parse(fs.readFileSync(partialPath, 'utf8'));
    const embeddedIds = new Set(partial.map(c => c.chunk_id));
    for (let i = 0; i < children.length; i++) {
      if (embeddedIds.has(children[i].chunk_id)) {
        children[i].embedding = partial.find(c => c.chunk_id === children[i].chunk_id).embedding;
      }
    }
    startBatch = Math.floor(partial.length / BATCH_SIZE);
    console.log(`  Resuming from batch ${startBatch} (${partial.length} already embedded)`);
  }

  const totalBatches = Math.ceil(children.length / BATCH_SIZE);
  for (let b = startBatch; b < totalBatches; b++) {
    const batch = children.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    console.log(`  Embedding batch ${b + 1}/${totalBatches} (${batch.length} chunks)...`);
    const embeddings = await embedBatch(batch.map(c => c.text));

    if (b === 0) {
      console.log(`  Embedding dimensionality: ${embeddings[0].length}`);
    }

    for (let i = 0; i < batch.length; i++) {
      batch[i].embedding = embeddings[i];
    }

    // Save partial progress
    const embedded = children.slice(0, (b + 1) * BATCH_SIZE).filter(c => c.embedding.length > 0);
    fs.writeFileSync(partialPath, JSON.stringify(embedded));
  }

  // Clean up partial file on success
  if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nBuilding corpus from: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  if (dryRun) console.log('DRY RUN — skipping embedding API calls\n');

  const doc = loadDocument(inputPath);
  const articles = doc.articles || [];
  console.log(`Found ${articles.length} articles`);

  const allChildren = [];
  const allParents = [];

  for (const article of articles) {
    const { children, parents } = buildChunks(article);
    allChildren.push(...children);
    allParents.push(...parents);
  }

  console.log(`\nBuilt ${allChildren.length} child chunks, ${allParents.length} parent chunks`);

  // Sanity assertions
  const parentIds = new Set(allParents.map(p => p.chunk_id));
  const orphans = allChildren.filter(c => !parentIds.has(c.parent_id));
  if (orphans.length > 0) {
    console.warn(`WARNING: ${orphans.length} child chunks have missing parent_id`);
  }

  if (!dryRun) {
    console.log('\nEmbedding child chunks...');
    await embedChunks(allChildren);
  }

  console.log('\nComputing BM25 IDF statistics...');
  const bm25Idf = computeBM25Idf(allChildren);
  console.log(`  Vocabulary size: ${Object.keys(bm25Idf.idf).length} terms`);
  console.log(`  Average doc length: ${bm25Idf.avgdl.toFixed(1)} tokens`);

  const corpus = {
    source_document: basename,
    children: allChildren,
    parents: allParents,
    bm25_idf: bm25Idf,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(corpus));
  console.log(`\nCorpus written to ${outputPath}`);

  if (dryRun) {
    console.log('\n--- DRY RUN SUMMARY ---');
    console.log(`Children: ${allChildren.length}`);
    console.log(`Parents:  ${allParents.length}`);
    console.log(`Orphaned children: ${orphans.length}`);
    const sample = allChildren.slice(0, 3);
    console.log('\nSample child chunks:');
    for (const c of sample) {
      console.log(`  ${c.full_path} | parent: ${c.parent_id} | text: ${c.text.slice(0,80)}...`);
    }
  }
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
