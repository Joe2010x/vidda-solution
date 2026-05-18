# RAG Module Design (As-Built)

---

## RAG Module Workflow (End-to-End)

```
[Offline / Build-time]
  documents/<InputFile>.json          ← passed as CLI argument
          │
          ▼
  scripts/build_corpus.js <inputPath> [--dry-run]
  ┌──────────────────────────────────────────────────────┐
  │  0. Derive output name from input:                   │
  │     basename = path.basename(inputPath, '.json')     │
  │     outputPath = src/data/${basename}_corpus.json    │
  │                                                      │
  │  1. Parse JSON → walkText + splitSubPoints           │
  │     Document → Article → Paragraph → Sub-point       │
  │     (pure regex; no external parser library)         │
  │                                                      │
  │  2. Build child chunks (sub-point level):            │
  │     - text = metadata-injected string                │
  │       "[Article 3: Obliged entities]                 │
  │        (1) This Regulation applies to: (a) ..."      │
  │     - store parent_id → parent paragraph chunk       │
  │                                                      │
  │  3. Embed child chunks via OpenRouter                │
  │     google/gemini-embedding-2-preview                │
  │     (skipped with --dry-run; embedding: [] stored)   │
  │     Resumable: .partial.json sidecar after each      │
  │     batch of 32                                      │
  │                                                      │
  │  4. Index BM25 term statistics over child chunks     │
  │     (IDF pre-computed, stored alongside corpus)      │
  │                                                      │
  │  5. Output → src/data/${basename}_corpus.json        │
  │     root field: "source_document": basename          │
  └──────────────────────────────────────────────────────┘
          │
          ▼
  src/data/${basename}_corpus.json

[Auto-build Hook]
  scripts/ensure_corpus.js  ← runs as npm predev / prestart
  ┌──────────────────────────────────────────────────────┐
  │  Four-case detection per document:                   │
  │  1. Corpus missing → build                           │
  │  2. Source JSON newer than corpus → rebuild          │
  │  3. Corpus has no embeddings + API key now set       │
  │     → run embedding build                            │
  │  4. All good → log retrieval mode                    │
  │                                                      │
  │  Retrieval mode reported at startup:                 │
  │  "hybrid (BM25 + dense)" or                          │
  │  "BM25-only (set OPENROUTER_API_KEY to enable)"      │
  └──────────────────────────────────────────────────────┘

[Runtime / Per Request]
  User Input: Job Role / Description
          │
          ▼
  riskAnalyzer.ts  →  Risk category slugs
  e.g. "customer-identification", "pep"
          │
          ▼
  /api/llm/enrich-risk  (POST, runtime: 'nodejs')
          │
          ▼
  handleEnrichRisk (src/llm/delivery/enrichRisk.ts)
  query = amirRequirements title + description for the risk
          │
          ▼
  retriever.ts
  ┌──────────────────────────────────────────────────────┐
  │  Corpus selection: registry.get(sourceDocument)      │
  │                                                      │
  │  If _embeddingsAvailable:                            │
  │    Sparse (BM25)  +  Dense (cosine sim)              │
  │    → RRF fusion → Top-20 child chunks                │
  │  Else (dry-run corpus):                              │
  │    BM25 only → Top-20 child chunks                   │
  │                                                      │
  │  Parent Document Retrieval:                          │
  │  for each hit → fetch parent paragraph chunk         │
  │  deduplicate parents → Top-20 parent contexts        │
  └──────────────────────────────────────────────────────┘
          │
          ▼
  prompts.ts  →  Inject Top-20 parent contexts into LLM prompt
  Format: (N) CITE AS: <full_path>\n<text>
          │
          ▼
  gemini-2.0-flash-lite
  Output: { reasoning: "...", citations: ["Article 3 § 1(a)", ...] }
          │
          ▼
  validator.ts
  ┌──────────────────────────────────────────────────────┐
  │  1. jsonrepair — fix minor JSON syntax               │
  │  2. normalizeCitation() on each citation:            │
  │     - strip [N] list-index prefix                    │
  │     - remove spaces before parens                    │
  │     - strip trailing roman-numeral paren group       │
  │     - normalize § spacing                            │
  │     - bare-article fallback: "Article N" → § 1       │
  │  3. Cross-check against _fullPathSet                 │
  │  4. FAIL → throw RAG_ENRICHMENT_FAILED               │
  └──────────────────────────────────────────────────────┘
          │
          ▼
  API Response: { reasoning, citations, contexts }
  contexts = [{ full_path, text }] for all retrieved parents
          │
          ▼
  page.tsx
  ┌──────────────────────────────────────────────────────┐
  │  Promise.allSettled fan-out over all risk categories │
  │  enrichmentByRisk: Record<string, EnrichmentResult>  │
  │  EnrichmentResult = { reasoning, citations,          │
  │                        contexts? }                   │
  │  Failures → enrichmentError amber banner             │
  └──────────────────────────────────────────────────────┘
          │
          ▼
  TrainingPlan.tsx
  ┌──────────────────────────────────────────────────────┐
  │  contextMap: Map<full_path, text>  (useMemo)         │
  │                                                      │
  │  Identified Risk Categories:                         │
  │  - each risk slug is a clickable toggle (▼/▲)        │
  │  - expands reasoning + citation badges               │
  │  - each badge expandable → shows full paragraph text │
  │                                                      │
  │  Recommended Training Modules:                       │
  │  - "Show regulatory provisions (N)" link             │
  │    (Layer 1 toggle, hidden by default)               │
  │  - all article badges appear on expand               │
  │    (Layer 2; each badge expandable → full text)      │
  │  - falls back to hardcoded regulatoryReference       │
  │    when no RAG data available                        │
  └──────────────────────────────────────────────────────┘
```

---

## Phase 1: Build-time Data Pipeline (Offline Preparation)

This code does not run when a user makes a request. It acts as a build script to generate the static knowledge base.

**Script:** `scripts/build_corpus.js`  
**Invocation:** `node scripts/build_corpus.js <inputPath> [--dry-run]`

### Chunking Strategy: Regex Parsing + Parent Document Retrieval + Metadata Injection

#### Parsing: walkText + splitSubPoints

The article `text` field is parsed with two functions:

**`walkText(articleText)`** — splits into paragraphs using two strategies:
- **Inline markers:** `/\((\d+)\)/` — paragraphs marked `(1)`, `(2)`, … within the text body.
- **Line-start markers:** `/^\s*\d+\.\s{3}/m` — paragraphs marked `1.   `, `2.   ` at the start of a line.
- **Fallback:** if neither pattern matches, the entire article text is treated as a single paragraph 1 with no sub-points.

**`splitSubPoints(paragraphText)`** — extracts lettered sub-points with a key constraint:

Sub-points are detected only if they form a **strict alphabetic sequence starting from `(a)`**. Each `(letter)` match is accepted only if the letter index equals the next expected position in the sequence. Any letter that breaks the sequence (e.g. `(i)`, `(v)`, `(x)` appearing after `(a)`, `(b)`) is treated as a roman numeral sub-sub-point and skipped entirely.

This is the primary guard against false positive sub-point splits on EU legal text, which uses roman numerals `(i)`, `(ii)`, … as a sub-sub-point level inside lettered sub-points.

#### Child Chunk Schema (embedding unit)

```json
{
  "chunk_id": "art3_p1_a",
  "parent_id": "art3_p1",
  "article_id": "Article 3",
  "article_title": "Obliged entities",
  "chapter": "CHAPTER I",
  "section": "SECTION 1",
  "paragraph": "1",
  "sub_point": "(a)",
  "full_path": "Article 3 § 1(a)",
  "text": "[Article 3: Obliged entities] (1) This Regulation applies to: (a) credit institutions;",
  "embedding": [0.023, -0.17, ...]
}
```

With `--dry-run`: `"embedding": []` — no API calls made.

#### Metadata Injection

The `text` field prefixes the full ancestral context so isolated chunks remain meaningful during retrieval:

```
[Article 3: Obliged entities] (1) This Regulation applies to: (a) credit institutions;
```

#### Parent Chunk Schema (LLM context unit)

```json
{
  "chunk_id": "art3_p1",
  "article_id": "Article 3",
  "article_title": "Obliged entities",
  "chapter": "CHAPTER I",
  "section": "SECTION 1",
  "paragraph": "1",
  "full_path": "Article 3 § 1",
  "text": "[Article 3: Obliged entities] (1) This Regulation applies to:\n(a) credit institutions;\n(b) payment institutions;\n..."
}
```

Parent chunks have no `embedding` field — they are never retrieval units, only LLM context providers.

### Embedding

- Model: `google/gemini-embedding-2-preview` via direct `fetch` to `https://openrouter.ai/api/v1/embeddings`.
- Batch size: 32 child chunks per request.
- Batches are sequential; simple retry on 429/5xx.
- After each successful batch, a `.partial.json` sidecar is written alongside the output file. On re-run, the script loads the sidecar and resumes from the last completed batch.

### Auto-build Hook (`scripts/ensure_corpus.js`)

Runs as `predev` and `prestart` npm lifecycle hooks — entirely outside webpack/Next.js bundling.

Four-case logic per source document:
1. **Corpus missing** → run full build (with or without embeddings depending on `OPENROUTER_API_KEY`).
2. **Source JSON newer than corpus** → rebuild.
3. **Corpus exists, `embedding: []`, and API key is now set** → run embedding build only.
4. **All good** → log retrieval mode: `hybrid (BM25 + dense)` or `BM25-only (set OPENROUTER_API_KEY to enable)`.

The hook covers only `documents/AMLCFT_Regulation.json` by default. Supporting additional documents requires extending the script to scan `documents/*.json`. The build script and corpus registry are already generic.

### Output Format

```json
{
  "source_document": "AMLCFT_Regulation",
  "children": [...],
  "parents":  [...],
  "bm25_idf": {
    "idf": { "term": 2.3, ... },
    "avgdl": 42.7,
    "doclen": { "chunk_id": 38, ... }
  }
}
```

---

## Phase 2: Runtime Retrieval Engine (In-Memory)

### Multi-Corpus Registry (`src/llm/rag/corpus_registry.ts`)

On Next.js cold start, scans `src/data/*_corpus.json` and loads every matching file into memory:

```ts
const registry = new Map<string, Corpus>()
// key = corpus.source_document (e.g. "AMLCFT_Regulation")
// value = { children, parents, bm25_idf, _parentIndex, _fullPathSet, _embeddingsAvailable }
```

Lazy indexes built on first access per corpus:
- `_parentIndex: Map<chunk_id, ParentChunk>` — O(1) parent lookup.
- `_fullPathSet: Set<string>` — O(1) citation validation.
- `_embeddingsAvailable: boolean` — `true` if any child has a non-empty `embedding` array.

Adding a new corpus requires only dropping a new `*_corpus.json` into `src/data/` and restarting.

> **Note:** `src/app/api/llm/enrich-risk/route.ts` must declare `export const runtime = 'nodejs'`. The Edge runtime has no `fs` access, which `corpus_registry.ts` requires for `fs.readdirSync`.

### Sparse Retrieval — BM25 (`src/llm/rag/sparse.ts`)

BM25 with length normalisation (`k1 = 1.5`, `b = 0.75`). Pre-computed IDF loaded from corpus. Operates over child chunks only. Returns `SearchResult[]` sorted descending.

```
score(t, d) = IDF(t) × [ tf(t,d) × (k1 + 1) ]
                         / [ tf(t,d) + k1 × (1 − b + b × |d| / avgdl) ]
```

### Dense Retrieval (`src/llm/rag/dense.ts`)

Embeds the query using `google/gemini-embedding-2-preview` at runtime via direct `fetch`. Result cached in `getLLMCache()` under key prefix `rag:embedding:` + query text (avoids re-embedding identical queries within the cache TTL).

Computes cosine similarity against all child chunk `embedding` vectors in memory. Returns `SearchResult[]`.

### Fusion + Parent Retrieval (`src/llm/rag/retriever.ts`)

```ts
retrieve(query: string, sourceDocument: string): Promise<ParentChunk[]>
```

1. Resolve `sourceDocument` → corpus from registry; throw `CORPUS_NOT_FOUND` if missing.
2. If `corpus._embeddingsAvailable`:
   - Run BM25 and dense retrieval in parallel (`Promise.all`).
   - RRF fusion (`k = 60`) → Top-20 child chunks.
3. Else (dry-run corpus, no embeddings):
   - BM25 only → Top-20 child chunks (no RRF).
4. For each child hit, look up `parent_id` in `_parentIndex`.
5. Deduplicate parents → return Top-20 unique parent chunks.
6. If result is empty → throw `RAG_ENRICHMENT_FAILED`.

---

## Phase 3: Pipeline Integration

### Delivery (`src/llm/delivery/enrichRisk.ts`)

```ts
interface EnrichRiskRequest  { riskCategory: string; sourceDocument?: string; }
interface EnrichRiskResponse {
  success: boolean;
  riskCategory: string;
  reasoning: string;
  citations: string[];
  contexts: Array<{ full_path: string; text: string }>;
  error?: 'CORPUS_NOT_FOUND' | 'RAG_ENRICHMENT_FAILED';
  message?: string;
}
```

Query construction: look up the matching `AMLRRequirement` from `amirRequirements` by `riskCategory`. If found, use `req.title + req.description.split('.')[0]` as the retrieval query; otherwise convert the kebab slug to a space-delimited phrase.

`contexts` in the response is the full list of retrieved parent chunks (all Top-20, not only the cited ones) — `full_path` + `text` pairs that the frontend uses to render expandable regulatory text without additional API calls.

### Constrained LLM Prompt (`src/llm/rag/prompts.ts`)

Numbered list format separates the list index from the citation path so the LLM cannot conflate them:

```
(N) CITE AS: Article 3 § 1(a)
[Article 3: Obliged entities] (1) This Regulation applies to: …
```

System prompt rules enforce:
- Citations must be copied exactly from the `CITE AS:` value.
- Do not include the leading `(N)` list number in citations.
- Citations must contain a paragraph number (`Article N § P`). Bare article names like `"Article 29"` are invalid.
- No sub-sub-levels `(i)`, `(ii)`, `(iv)`, `(x)`.

### API Route (`src/app/api/llm/enrich-risk/route.ts`)

POST handler. Must include:
```ts
export const runtime = 'nodejs';
```

---

## Phase 4: Strict Guards & Error Propagation

### Citation Validation (`src/llm/rag/validator.ts`)

**`normalizeCitation(raw)`** — applied before checking against `_fullPathSet`:

1. Strip leading `[N]` list-index prefix (LLM copying the prompt format).
2. Remove spaces before opening parens: `§ 2 (a)` → `§ 2(a)`.
3. Strip any trailing second paren group: `Article 9 § 2(a)(iv)` → `Article 9 § 2(a)`. Handles both multi-char `(iv)` and single-char `(x)`, `(i)`, `(v)`.
4. Normalize whitespace around `§`.
5. **Bare-article fallback**: if the result has no `§`, match `Article N` and attempt `Article N § 1`. If that path is in `_fullPathSet`, return the resolved form; otherwise leave it as-is for rejection.

This layered normalization catches common LLM formatting deviations without allowing hallucinated article references through.

**`validateEnrichment(rawLLMOutput, corpus)`** returns `EnrichmentResult` or throws:
- `RAG_ENRICHMENT_FAILED` if any citation is not in `_fullPathSet` after normalization.
- `RAG_ENRICHMENT_FAILED` if no valid citations remain.

**Error responses:**
```json
{ "error": "CORPUS_NOT_FOUND",      "message": "No corpus loaded for the requested source document." }
{ "error": "RAG_ENRICHMENT_FAILED", "message": "Regulatory document unavailable or no relevant articles found." }
```

No fallback to hardcoded data on any error path.

---

## Phase 5: Frontend Integration

### Type (`src/types/rag.ts`)

```ts
interface EnrichmentResult {
  reasoning: string;
  citations: string[];
  contexts?: Array<{ full_path: string; text: string }>;
}
```

`contexts` carries the full parent-chunk text for each retrieved paragraph. It is populated in `handleEnrichRisk` and forwarded to frontend state.

### `page.tsx` — Fan-out

After `/analyze-risk` resolves, fans out `Promise.allSettled` calls to `/api/llm/enrich-risk` for every identified risk category in parallel:

```ts
enrichMap[category] = {
  reasoning: result.value.reasoning,
  citations: result.value.citations,
  contexts: result.value.contexts ?? [],
};
```

Successes accumulate into `enrichmentByRisk: Record<string, EnrichmentResult>`. Failures produce a single `enrichmentError` string displayed as an amber banner in `TrainingPlan.tsx`.

### `TrainingPlan.tsx` — Interaction Model

A `contextMap: Map<full_path, text>` is built from all enrichment contexts using `useMemo`. This enables O(1) text lookup for any citation badge without additional API calls.

**Identified Risk Categories:**
- Each risk slug is a `<button>` toggle (`▼`/`▲`). Click expands a panel showing:
  - `enrichment.reasoning` paragraph.
  - Citation badges (gray: `bg-gray-50 text-gray-500 border-gray-200`).
  - Each badge is individually expandable: clicking shows the full regulatory paragraph text in a quoted block (`border-l-2 border-gray-200 bg-gray-50/50`). Clicking again collapses.

**Recommended Training Modules (two-layer disclosure):**
- **Layer 1** — "Show regulatory provisions (N)" / "Hide regulatory provisions": plain underline-link button. Shown only when RAG citations exist for the module's `requirement.riskCategories`. Falls back silently to the hardcoded `requirement.regulatoryReference` string when no RAG data is available.
- **Layer 2** — All matching article badges in a wrapping flex row, shown after Layer 1 is opened. Same gray badge style and individual expand behaviour. Collapsing Layer 1 resets any open article.

Citation aggregation per module:
```ts
const ragCitations = Array.from(new Set(
  item.requirement.riskCategories.flatMap(
    (cat) => enrichmentByRisk[cat]?.citations ?? []
  )
));
```

### `HumanReview.tsx`

The "Regulatory Basis:" section and `enrichmentByRisk` / `enrichmentError` props were removed. All regulatory citation display is consolidated in `TrainingPlan.tsx`.
