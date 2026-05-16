/**
 * API Route: LLM Training Plan Validation
 * Validates a training plan and provides AI-powered assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ValidatePlanRequest, ValidatePlanResponse } from '@/llm/delivery/validatePlan';
import { handleValidatePlan } from '@/llm/delivery/validatePlan';

export async function POST(request: NextRequest) {
  try {
    const body: ValidatePlanRequest = await request.json();

    const result = await handleValidatePlan(body);
    return NextResponse.json<ValidatePlanResponse>(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Training plan validation API error:', error);
    
    return NextResponse.json<ValidatePlanResponse>(
      {
        success: false,
        validationScore: null,
        llmAnalysis: null,
        reviewAssessment: null,
        fallbackUsed: true,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}