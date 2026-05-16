/**
 * API Route: LLM Risk Analysis + Requirements Retrieval
 * Analyzes a role's tasks to identify AML/CFT risk categories and retrieve matching requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { Role, AMLRRequirement } from '@/types';
import { retrieveRequirementsWithLLM, RiskAnalysisResult } from '@/lib/llm/riskAnalyzer';

export interface AnalyzeRiskRequest {
  role: Role;
}

export interface AnalyzeRiskResponse {
  success: boolean;
  riskCategories: string[];
  requirements: AMLRRequirement[];
  mappedRisks: string[];
  analysis: RiskAnalysisResult | null;
  fallbackUsed: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRiskRequest = await request.json();
    
    if (!body.role) {
      return NextResponse.json<AnalyzeRiskResponse>(
        {
          success: false,
          riskCategories: [],
          requirements: [],
          mappedRisks: [],
          analysis: null,
          fallbackUsed: false,
          error: 'Role data is required',
        },
        { status: 400 }
      );
    }

    const result = await retrieveRequirementsWithLLM(body.role);

    return NextResponse.json<AnalyzeRiskResponse>({
      success: true,
      riskCategories: result.mappedRisks,
      requirements: result.requirements,
      mappedRisks: result.mappedRisks,
      analysis: result.analysis,
      fallbackUsed: result.fallbackUsed,
    });
  } catch (error) {
    console.error('Risk analysis API error:', error);
    
    return NextResponse.json<AnalyzeRiskResponse>(
      {
        success: false,
        riskCategories: [],
        requirements: [],
        mappedRisks: [],
        analysis: null,
        fallbackUsed: true,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}