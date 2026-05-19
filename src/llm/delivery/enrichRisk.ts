import { amlrRequirements } from '@/data/amlrRequirements';
import { getLLMClient } from '@/llm/preparation/client';
import { retrieve } from '@/llm/rag/retriever';
import { buildEnrichmentPrompt } from '@/llm/rag/prompts';
import { validateEnrichment } from '@/llm/rag/validator';
import { getCorpus } from '@/llm/rag/corpus_registry';
import { DEFAULT_SOURCE_DOCUMENT } from '@/llm/rag/constants';
import type { EnrichmentResult } from '@/types/rag';

export interface EnrichRiskRequest {
  riskCategory: string;
  sourceDocument?: string;
}

export interface EnrichRiskResponse {
  success: boolean;
  riskCategory: string;
  reasoning: string;
  citations: string[];
  contexts: Array<{ full_path: string; text: string }>;
  error?: 'CORPUS_NOT_FOUND' | 'RAG_ENRICHMENT_FAILED';
  message?: string;
}

function categoryToQuery(riskCategory: string): string {
  const req = amlrRequirements.find(r => r.riskCategories.includes(riskCategory));
  if (req) {
    return `${req.title}. ${req.description.split('.')[0]}.`;
  }
  return riskCategory.replace(/-/g, ' ');
}

export async function handleEnrichRisk(body: EnrichRiskRequest): Promise<EnrichRiskResponse> {
  if (!body?.riskCategory) {
    return {
      success: false,
      riskCategory: '',
      reasoning: '',
      citations: [],
      contexts: [],
      error: 'RAG_ENRICHMENT_FAILED',
      message: 'riskCategory is required',
    };
  }

  const sourceDocument = body.sourceDocument ?? DEFAULT_SOURCE_DOCUMENT;
  const query = categoryToQuery(body.riskCategory);

  try {
    const parents = await retrieve(query, sourceDocument);
    const corpus = getCorpus(sourceDocument);

    const { system, user } = buildEnrichmentPrompt(query, parents);
    const client = getLLMClient();
    const rawOutput = await client.generateResponse(user, system);

    const result: EnrichmentResult = validateEnrichment(rawOutput, corpus);

    return {
      success: true,
      riskCategory: body.riskCategory,
      reasoning: result.reasoning,
      citations: result.citations,
      contexts: parents.map(p => ({ full_path: p.full_path, text: p.text })),
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const code = error.code === 'CORPUS_NOT_FOUND' ? 'CORPUS_NOT_FOUND' : 'RAG_ENRICHMENT_FAILED';
    return {
      success: false,
      riskCategory: body.riskCategory,
      reasoning: '',
      citations: [],
      contexts: [],
      error: code,
      message: error.message ?? 'Regulatory enrichment failed.',
    };
  }
}
