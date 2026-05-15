/**
 * API Route: LLM Training Plan Generation
 * Generates an optimized training plan using LLM analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { Role, AMLRRequirement } from '@/types';
import { generateTrainingPlanWithLLM, EnhancedTrainingPlan } from '@/lib/llm/planGenerator';

export interface GeneratePlanRequest {
  role: Role;
  requirements: AMLRRequirement[];
  riskCategories: string[];
}

export interface GeneratePlanResponse {
  success: boolean;
  plan: EnhancedTrainingPlan | null;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePlanRequest = await request.json();
    
    if (!body.role || !body.requirements || !body.riskCategories) {
      return NextResponse.json<GeneratePlanResponse>(
        {
          success: false,
          plan: null,
          error: 'Role, requirements, and risk categories are required',
        },
        { status: 400 }
      );
    }

    const result = await generateTrainingPlanWithLLM(
      body.role,
      body.requirements,
      body.riskCategories
    );

    return NextResponse.json<GeneratePlanResponse>({
      success: true,
      plan: result,
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