import { parseJSONFromLLM } from '@/llm/preparation/parseJson';
import type { Corpus, EnrichmentResult } from '@/types/rag';

// Normalize LLM-generated citation strings to match corpus full_path format.
//
// Handles:
//   [2] Article 20 § 1(a)   → Article 20 § 1(a)   (strip list-index prefix)
//   Article 9 § 2 (a) (ix)  → Article 9 § 2(a)    (strip spaces + roman suffix)
//   Article 9 § 2(a)(x)     → Article 9 § 2(a)    (strip second paren group)
function normalizeCitation(raw: string): string {
  let s = raw.trim();

  // 1. Strip leading list-index that the LLM copies from the prompt: "[2] Article..."
  s = s.replace(/^\[\d+\]\s*/, '');

  // 2. Remove spaces before opening parens: "§ 2 (a)" → "§ 2(a)"
  s = s.replace(/\s+\(/g, '(');

  // 3. Strip any second trailing paren group (sub-sub-point level not in corpus):
  //    "Article 9 § 2(a)(x)" → "Article 9 § 2(a)"
  //    This covers both multi-char "(iv)" and single-char "(x)", "(i)", "(v)".
  s = s.replace(/(\([a-z]+\))\([a-z]+\)\s*$/, '$1');

  // 4. Normalise whitespace around §
  s = s.replace(/\s*§\s*/g, ' § ');

  return s.trim();
}

export function validateEnrichment(rawLLMOutput: string, corpus: Corpus): EnrichmentResult {
  const parsed = parseJSONFromLLM<{ reasoning?: string; citations?: string[] }>(
    rawLLMOutput,
    { reasoning: '', citations: [] }
  );

  const reasoning = parsed.reasoning?.trim() ?? '';
  const rawCitations = Array.isArray(parsed.citations) ? parsed.citations : [];

  const fullPathSet = corpus._fullPathSet!;

  function normalizeCitationWithFallback(raw: string): string {
    let s = normalizeCitation(raw);
    // Bare article citation (no §) — try resolving to paragraph 1
    if (!s.includes('§')) {
      const bare = s.match(/^(Article\s+\d+)\s*$/);
      if (bare) {
        const candidate = `${bare[1]} § 1`;
        if (fullPathSet.has(candidate)) return candidate;
      }
    }
    return s;
  }

  // Normalize, then filter to only citations that exist in the corpus
  const validCitations: string[] = [];
  const invalid: string[] = [];

  for (const raw of rawCitations) {
    const normalized = normalizeCitationWithFallback(raw);
    if (fullPathSet.has(normalized)) {
      validCitations.push(normalized);
    } else {
      invalid.push(raw);
    }
  }

  if (invalid.length > 0) {
    throw Object.assign(
      new Error(`Hallucinated citations detected: ${invalid.join(', ')}`),
      { code: 'RAG_ENRICHMENT_FAILED' }
    );
  }

  if (validCitations.length === 0) {
    throw Object.assign(
      new Error('LLM returned no citations.'),
      { code: 'RAG_ENRICHMENT_FAILED' }
    );
  }

  return { reasoning, citations: validCitations };
}
