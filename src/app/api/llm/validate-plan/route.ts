/**
 * API Route: LLM Training Plan Validation
 * Validates a training plan and provides AI-powered assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { Role, AMLRRequirement, TrainingPlan } from '@/types';
import { comprehensiveValidation } from '@/lib/llm/validator';

export interface ValidatePlanRequest {
  role: Role;
  requirements: AMLRRequirement[];
  trainingPlan: TrainingPlan;
  riskCategories: string[];
}

export interface ValidatePlanResponse {
  success: boolean;
  validationScore: any;
  llmAnalysis: any;
  reviewAssessment: any;
  fallbackUsed: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidatePlanRequest = await request.json();
    
    if (!body.role || !body.requirements || !body.trainingPlan || !body.riskCategories) {
      return NextResponse.json<ValidatePlanResponse>(
        {
          success: false,
          validationScore: null,
          llmAnalysis: null,
          reviewAssessment: null,
          fallbackUsed: false,
          error: 'Role, requirements, training plan, and risk categories are required',
        },
        { status: 400 }
      );
    }

    const result = await comprehensiveValidation(
      body.role,
      body.requirements,
      body.trainingPlan,
      body.riskCategories
    );

    return NextResponse.json<ValidatePlanResponse>({
      success: true,
      validationScore: result.combinedScore,
      llmAnalysis: result.llmAnalysis,
      reviewAssessment: result.reviewAssessment,
      fallbackUsed: result.fallbackUsed,
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