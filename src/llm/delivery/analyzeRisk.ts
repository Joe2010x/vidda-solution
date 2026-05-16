import type { Role, AMLRRequirement } from '@/types';
import type { RiskAnalysisResult } from '../extraction/riskAnalyzer';
import { retrieveRequirementsWithLLM } from '../retrieval/requirementsWithLLM';

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

export async function handleAnalyzeRisk(body: AnalyzeRiskRequest): Promise<AnalyzeRiskResponse> {
  if (!body?.role) {
    return {
      success: false,
      riskCategories: [],
      requirements: [],
      mappedRisks: [],
      analysis: null,
      fallbackUsed: false,
      error: 'Role data is required',
    };
  }

  const result = await retrieveRequirementsWithLLM(body.role);

  return {
    success: true,
    riskCategories: result.mappedRisks,
    requirements: result.requirements,
    mappedRisks: result.mappedRisks,
    analysis: result.analysis,
    fallbackUsed: result.fallbackUsed,
  };
}
