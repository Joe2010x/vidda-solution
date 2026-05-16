/**
 * API Route: LLM Training Plan Generation
 * Generates an optimized training plan using LLM analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import type { GeneratePlanRequest, GeneratePlanResponse } from '@/llm/delivery/generatePlan';
import { handleGeneratePlan } from '@/llm/delivery/generatePlan';

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePlanRequest = await request.json();

    const result = await handleGeneratePlan(body);
    return NextResponse.json<GeneratePlanResponse>(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Training plan generation API error:', error);
    
    return NextResponse.json<GeneratePlanResponse>(
      {
        success: false,
        plan: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}