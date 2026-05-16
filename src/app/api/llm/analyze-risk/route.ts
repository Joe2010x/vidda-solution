/**
 * API Route: LLM Risk Analysis + Requirements Retrieval
 * Analyzes a role's tasks to identify AML/CFT risk categories and retrieve matching requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AnalyzeRiskRequest, AnalyzeRiskResponse } from '@/llm/delivery/analyzeRisk';
import { handleAnalyzeRisk } from '@/llm/delivery/analyzeRisk';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRiskRequest = await request.json();

    const result = await handleAnalyzeRisk(body);
    return NextResponse.json<AnalyzeRiskResponse>(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Risk analysis API error:', error);
    
    const response: AnalyzeRiskResponse = {
      success: false,
      riskCategories: [],
      requirements: [],
      mappedRisks: [],
      analysis: null,
      fallbackUsed: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json<AnalyzeRiskResponse>(response, { status: 500 });
  }
}