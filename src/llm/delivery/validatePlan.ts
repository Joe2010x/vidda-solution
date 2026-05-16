import type { Role, AMLRRequirement, TrainingPlan } from '@/types';
import { comprehensiveValidation } from '../validation/validator';

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

export async function handleValidatePlan(body: ValidatePlanRequest): Promise<ValidatePlanResponse> {
  if (!body?.role || !body?.requirements || !body?.trainingPlan || !body?.riskCategories) {
    return {
      success: false,
      validationScore: null,
      llmAnalysis: null,
      reviewAssessment: null,
      fallbackUsed: false,
      error: 'Role, requirements, training plan, and risk categories are required',
    };
  }

  const result = await comprehensiveValidation(body.role, body.requirements, body.trainingPlan, body.riskCategories);

  return {
    success: true,
    validationScore: result.combinedScore,
    llmAnalysis: result.llmAnalysis,
    reviewAssessment: result.reviewAssessment,
    fallbackUsed: result.fallbackUsed,
  };
}
