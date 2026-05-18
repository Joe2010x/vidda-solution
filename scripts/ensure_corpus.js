// Pre-start check: runs before `npm run dev` and `npm run start`.
// Detects whether the corpus needs to be built, then runs build_corpus.js if so.
// Fully outside webpack — plain Node.js CommonJS.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INPUT_PATH = path.join(process.cwd(), 'documents', 'AMLCFT_Regulation.json');
const CORPUS_PATH = path.join(process.cwd(), 'src', 'data', 'AMLCFT_Regulation_corpus.json');

function sourceNewerThanCorpus() {
  const srcMtime = fs.statSync(INPUT_PATH).mtimeMs;
  const corpusMtime = fs.statSync(CORPUS_PATH).mtimeMs;
  return srcMtime > corpusMtime;
}

function hasEmbeddings() {
  const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));
  return Array.isArray(corpus.children) &&
    corpus.children.some(c => c.embedding && c.embedding.length > 0);
}

function runBuild(dryRun) {
  const flag = dryRun ? ' --dry-run' : '';
  const cmd = `node scripts/build_corpus.js documents/AMLCFT_Regulation.json${flag}`;
  console.log(`[RAG] Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.log('[RAG] Source document not found, skipping corpus check.');
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  // Case 1: corpus does not exist
  if (!fs.existsSync(CORPUS_PATH)) {
    if (apiKey) {
      console.log('[RAG] Corpus not found — building with embeddings...');
      runBuild(false);
    } else {
      console.log('[RAG] Corpus not found — no OPENROUTER_API_KEY, building structure only (BM25 mode)...');
      runBuild(true);
    }
    return;
  }

  // Case 2: source document updated after corpus was built
  if (sourceNewerThanCorpus()) {
    if (apiKey) {
      console.log('[RAG] Source document updated — rebuilding corpus with embeddings...');
      runBuild(false);
    } else {
      console.log('[RAG] Source document updated — rebuilding structure only (BM25 mode)...');
      runBuild(true);
    }
    return;
  }

  // Case 3: corpus exists but embeddings are empty and API key is now available
  if (apiKey && !hasEmbeddings()) {
    console.log('[RAG] Corpus has no embeddings — running embedding build...');
    runBuild(false);
    return;
  }

  // Case 4: all good
  const mode = hasEmbeddings() ? 'hybrid (BM25 + dense)' : 'BM25-only (set OPENROUTER_API_KEY to enable)';
  console.log(`[RAG] Corpus ready — retrieval mode: ${mode}`);
}

try {
  main();
} catch (err) {
  console.error('[RAG] ensure_corpus failed:', err.message);
  // Non-zero exit so npm prints a warning, but don't block startup
  process.exit(0);
}
