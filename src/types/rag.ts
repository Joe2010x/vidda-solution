export interface ChildChunk {
  chunk_id: string;
  parent_id: string;
  article_id: string;
  article_title: string;
  chapter?: string;
  section?: string;
  paragraph: string;
  sub_point?: string;
  full_path: string;
  text: string;
  embedding: number[];
}

export interface ParentChunk {
  chunk_id: string;
  article_id: string;
  article_title: string;
  chapter?: string;
  section?: string;
  paragraph: string;
  full_path: string;
  text: string;
}

export interface BM25Index {
  idf: Record<string, number>;
  avgdl: number;
  doclen: Record<string, number>;
}

export interface Corpus {
  source_document: string;
  children: ChildChunk[];
  parents: ParentChunk[];
  bm25_idf: BM25Index;
  _parentIndex?: Map<string, ParentChunk>;
  _fullPathSet?: Set<string>;
  _embeddingsAvailable?: boolean;
}

export interface SearchResult {
  chunk_id: string;
  score: number;
}

export interface EnrichmentResult {
  reasoning: string;
  citations: string[];
  contexts?: Array<{ full_path: string; text: string }>;
}
