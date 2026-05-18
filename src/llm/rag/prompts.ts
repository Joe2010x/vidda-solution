import type { ParentChunk } from '@/types/rag';

export const ENRICHMENT_SYSTEM_PROMPT = `You are a regulatory compliance expert. You will be given a set of legal clauses from the EU Anti-Money Laundering Regulation (AMLR) and a compliance risk topic.

Your task:
1. Based ONLY on the provided clauses, explain why the given risk topic requires employee training.
2. Cite only the clauses that directly support your reasoning.

Output STRICTLY as valid JSON with this shape:
{
  "reasoning": "...",
  "citations": ["Article 3 § 1(a)", "Article 7 § 2"]
}

Rules:
- Each citation MUST be copied EXACTLY from the "CITE AS:" value of the relevant clause. Do NOT include the leading "(N)" list number.
- A valid citation MUST contain a paragraph number: "Article N § P" or "Article N § P(x)". Do NOT cite bare article names like "Article 29" — always specify the paragraph.
- Valid citation formats: "Article N § P" or "Article N § P(x)" where x is a single lowercase letter. Do NOT add further nesting like (i), (ii), (iv), (x) — those sub-levels do not exist in the citation system.
- Only cite clauses whose "CITE AS:" value appears in the list above. Do not invent or modify citation strings.
- "reasoning" must be a single coherent paragraph.
- Output nothing outside the JSON object.`;

export function buildEnrichmentPrompt(
  riskQuery: string,
  parents: ParentChunk[]
): { system: string; user: string } {
  // Format: separate the list index from the full_path so the LLM never conflates them.
  // The citation to use is the value after "CITE AS:", not the leading number.
  const clauseList = parents
    .map((p, i) => `(${i + 1}) CITE AS: ${p.full_path}\n${p.text}`)
    .join('\n\n');

  const user = `Risk topic: "${riskQuery}"

Relevant regulatory clauses:
${clauseList}`;

  return { system: ENRICHMENT_SYSTEM_PROMPT, user };
}
