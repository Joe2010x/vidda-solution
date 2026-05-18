import { tokenize } from './tokenizer';
import { BM25_K1, BM25_B } from './constants';
import type { Corpus, SearchResult } from '@/types/rag';

export function bm25Score(query: string, corpus: Corpus): SearchResult[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const { idf, avgdl, doclen } = corpus.bm25_idf;
  const scores = new Map<string, number>();

  for (const child of corpus.children) {
    const tokens = tokenize(child.text);
    const dl = doclen[child.chunk_id] ?? tokens.length;
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);

    let score = 0;
    for (const term of queryTerms) {
      const termIdf = idf[term];
      if (!termIdf) continue;
      const termTf = tf.get(term) ?? 0;
      const numerator = termTf * (BM25_K1 + 1);
      const denominator = termTf + BM25_K1 * (1 - BM25_B + BM25_B * (dl / avgdl));
      score += termIdf * (numerator / denominator);
    }

    if (score > 0) scores.set(child.chunk_id, score);
  }

  return Array.from(scores.entries())
    .map(([chunk_id, score]) => ({ chunk_id, score }))
    .sort((a, b) => b.score - a.score);
}
