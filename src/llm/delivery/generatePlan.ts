import type { Role, AMLRRequirement } from '@/types';
import { generateTrainingPlanWithLLM, type EnhancedTrainingPlan } from '../generation/planGenerator';

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

export async function handleGeneratePlan(body: GeneratePlanRequest): Promise<GeneratePlanResponse> {
  if (!body?.role || !body?.requirements || !body?.riskCategories) {
    return {
      success: false,
      plan: null,
      error: 'Role, requirements, and risk categories are required',
    };
  }

  const result = await generateTrainingPlanWithLLM(body.role, body.requirements, body.riskCategories);

  return {
    success: true,
    plan: result,
  };
}
