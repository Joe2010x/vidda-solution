import { NextRequest, NextResponse } from 'next/server';
import type { EnrichRiskRequest, EnrichRiskResponse } from '@/llm/delivery/enrichRisk';
import { handleEnrichRisk } from '@/llm/delivery/enrichRisk';

// Required: corpus loading uses fs.readdirSync which needs the Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: EnrichRiskRequest = await request.json();
    const result = await handleEnrichRisk(body);
    return NextResponse.json<EnrichRiskResponse>(result, {
      status: result.success ? 200 : (result.error === 'CORPUS_NOT_FOUND' ? 503 : 422),
    });
  } catch (error) {
    console.error('Enrich risk API error:', error);
    const response: EnrichRiskResponse = {
      success: false,
      riskCategory: '',
      reasoning: '',
      citations: [],
      contexts: [],
      error: 'RAG_ENRICHMENT_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    return NextResponse.json<EnrichRiskResponse>(response, { status: 500 });
  }
}
