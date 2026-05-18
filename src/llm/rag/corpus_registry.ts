import fs from 'fs';
import path from 'path';
import type { Corpus, ParentChunk } from '@/types/rag';

let registry: Map<string, Corpus> | null = null;

function buildIndexes(corpus: Corpus): void {
  if (!corpus._parentIndex) {
    corpus._parentIndex = new Map<string, ParentChunk>(
      corpus.parents.map(p => [p.chunk_id, p])
    );
  }
  if (!corpus._fullPathSet) {
    const paths = [
      ...corpus.children.map(c => c.full_path),
      ...corpus.parents.map(p => p.full_path),
    ];
    corpus._fullPathSet = new Set(paths);
  }
  // Detect whether embeddings are present (i.e. build script ran with real API calls)
  if (corpus._embeddingsAvailable === undefined) {
    corpus._embeddingsAvailable = corpus.children.some(c => c.embedding && c.embedding.length > 0);
    if (!corpus._embeddingsAvailable) {
      console.warn(`[corpus_registry] ${corpus.source_document}: embeddings are empty — using BM25-only retrieval. Run \`npm run build:corpus\` with OPENROUTER_API_KEY to enable hybrid search.`);
    }
  }
}

function loadCorpora(): Map<string, Corpus> {
  const dataDir = path.join(process.cwd(), 'src', 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_corpus.json'));

  if (files.length === 0) {
    throw new Error('No corpus files found in src/data/. Run `npm run build:corpus` first.');
  }

  const map = new Map<string, Corpus>();
  for (const file of files) {
    const corpus: Corpus = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    buildIndexes(corpus);
    map.set(corpus.source_document, corpus);
    console.log(`[corpus_registry] Loaded corpus: ${corpus.source_document} (${corpus.children.length} children, ${corpus.parents.length} parents)`);
  }

  return map;
}

function getRegistry(): Map<string, Corpus> {
  if (!registry) {
    registry = loadCorpora();
  }
  return registry;
}

export function getCorpus(sourceDocument: string): Corpus {
  const map = getRegistry();
  const corpus = map.get(sourceDocument);
  if (!corpus) {
    const available = Array.from(map.keys()).join(', ');
    throw Object.assign(
      new Error(`Corpus not found: "${sourceDocument}". Available: ${available}`),
      { code: 'CORPUS_NOT_FOUND' }
    );
  }
  return corpus;
}
