import { getCorpus } from './corpus_registry';
import { bm25Score } from './sparse';
import { denseScore } from './dense';
import { RRF_K, TOP_K_CHILDREN, TOP_K_PARENTS } from './constants';
import type { ParentChunk, SearchResult } from '@/types/rag';

function rrfFuse(lists: SearchResult[][]): SearchResult[] {
  const scores = new Map<string, number>();

  for (const list of lists) {
    list.forEach((item, rank) => {
      const prev = scores.get(item.chunk_id) ?? 0;
      scores.set(item.chunk_id, prev + 1 / (RRF_K + rank + 1));
    });
  }

  return Array.from(scores.entries())
    .map(([chunk_id, score]) => ({ chunk_id, score }))
    .sort((a, b) => b.score - a.score);
}

export async function retrieve(query: string, sourceDocument: string): Promise<ParentChunk[]> {
  const corpus = getCorpus(sourceDocument); // throws CORPUS_NOT_FOUND if missing

  const sparseResults = bm25Score(query, corpus);

  let rankedLists: SearchResult[];
  if (corpus._embeddingsAvailable) {
    const denseResults = await denseScore(query, corpus);
    rankedLists = rrfFuse([sparseResults, denseResults]);
  } else {
    // Dry-run corpus: no embeddings — fall back to BM25 only
    rankedLists = sparseResults;
  }

  const fused = rankedLists;
  const topChildren = fused.slice(0, TOP_K_CHILDREN);

  const parentIndex = corpus._parentIndex!;
  const seen = new Set<string>();
  const parents: ParentChunk[] = [];

  for (const { chunk_id } of topChildren) {
    const child = corpus.children.find(c => c.chunk_id === chunk_id);
    if (!child) continue;
    const parentId = child.parent_id;
    if (seen.has(parentId)) continue;
    seen.add(parentId);
    const parent = parentIndex.get(parentId);
    if (parent) parents.push(parent);
    if (parents.length >= TOP_K_PARENTS) break;
  }

  if (parents.length === 0) {
    throw Object.assign(
      new Error('No relevant regulatory clauses found for this query.'),
      { code: 'RAG_ENRICHMENT_FAILED' }
    );
  }

  return parents;
}
