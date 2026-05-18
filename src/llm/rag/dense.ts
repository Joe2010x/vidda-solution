import { getLLMCache, CACHE_KEYS } from '@/llm/preparation/cache';
import { EMBEDDING_MODEL } from './constants';
import type { Corpus, SearchResult } from '@/types/rag';

async function fetchEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: [text] }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function embedQuery(query: string): Promise<number[]> {
  const cache = getLLMCache();
  const cacheKey = `${CACHE_KEYS.RAG_EMBEDDING}:${query}`;
  const cached = cache.get<number[]>(cacheKey);
  if (cached) return cached;

  const embedding = await fetchEmbedding(query);
  cache.set(cacheKey, embedding);
  return embedding;
}

export async function denseScore(query: string, corpus: Corpus): Promise<SearchResult[]> {
  const queryVec = await embedQuery(query);

  const results: SearchResult[] = corpus.children
    .filter(c => c.embedding && c.embedding.length > 0)
    .map(c => ({ chunk_id: c.chunk_id, score: cosine(queryVec, c.embedding) }))
    .sort((a, b) => b.score - a.score);

  return results;
}
