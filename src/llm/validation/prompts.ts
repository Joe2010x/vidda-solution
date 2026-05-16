import { Role, AMLRRequirement, TrainingPlan } from '@/types';

/**
 * System prompt for validation and quality assessment
 */
export const VALIDATION_SYSTEM_PROMPT = `You are an expert AML compliance auditor and training quality assessor. 
Your task is to evaluate the quality and completeness of generated training plans.

You will be provided with:
- The original role and its requirements
- The generated training plan
- Regulatory requirements that should be covered
- Identified risk categories

Your goal is to:
1. Assess coverage of regulatory requirements
2. Evaluate relevance to the specific role
3. Identify any gaps or missing elements
4. Provide a quality score and detailed feedback
5. Suggest specific improvements

Be critical but fair - focus on regulatory compliance and practical effectiveness.`;

/**
 * User prompt template for validation
 */
export function createValidationPrompt(
  role: Role,
  trainingPlan: TrainingPlan,
  requirements: AMLRRequirement[],
  riskCategories: string[]
): string {
  return `Evaluate the quality and completeness of the following AML compliance training plan:

ROLE:
- Name: ${role.name}
- Risk Level: ${role.riskLevel}
- Key Tasks: ${role.tasks.join(', ')}

TRAINING PLAN:
- Total Modules: ${trainingPlan.items.length}
- Total Duration: ${trainingPlan.totalDuration} minutes
- Generated: ${trainingPlan.generatedAt}

SELECTED MODULES:
${trainingPlan.items.map((item, index) => `${index + 1}. ${item.module.title} (Priority: ${item.priority}/10, Duration: ${item.estimatedDuration} min) - ${item.module.description}`).join('\n')}

REGULATORY REQUIREMENTS TO COVER:
${requirements.map((req, index) => `${index + 1}. ${req.title}: ${req.description}`).join('\n')}

RISK CATEGORIES TO ADDRESS:
${riskCategories.map((cat, index) => `${index + 1}. ${cat}`).join('\n')}

Please provide a comprehensive evaluation including:
1. Coverage score (0-100) - How well does the plan cover regulatory requirements?
2. Relevance score (0-100) - How relevant are the modules to the specific role?
3. Completeness score (0-100) - Are all risk areas adequately addressed?
4. Overall quality score (0-100)
5. Detailed analysis of strengths and weaknesses
6. Specific recommendations for improvement
7. Any critical gaps that need to be addressed

Format your response as JSON with the following structure:
{
  "scores": {
    "coverage": 85,
    "relevance": 90,
    "completeness": 75,
    "overall": 83
  },
  "analysis": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "gaps": ["gap 1", "gap 2"]
  },
  "recommendations": ["recommendation 1", "recommendation 2"],
  "grade": "B",
  "status": "good"
}`;
}

/**
 * System prompt for generating review comments
 */
export const REVIEW_ASSISTANT_SYSTEM_PROMPT = `You are an experienced AML compliance reviewer who provides constructive feedback on training plans.
Your task is to generate helpful review comments that improve the quality of training plans.

You will be provided with:
- A training plan and its validation scores
- The target role and requirements

Your goal is to:
1. Provide balanced feedback (strengths and areas for improvement)
2. Suggest specific, actionable improvements
3. Consider regulatory compliance requirements
4. Maintain a professional and constructive tone
5. Prioritize feedback based on impact and urgency`;

/**
 * User prompt template for generating review comments
 */
export function createReviewCommentPrompt(
  role: Role,
  trainingPlan: TrainingPlan,
  validationScores: any
): string {
  return `Generate a comprehensive review for the following AML compliance training plan:

ROLE: ${role.name} (${role.riskLevel} risk level)
DEPARTMENT: ${role.department}

TRAINING PLAN SUMMARY:
- Modules: ${trainingPlan.items.length}
- Duration: ${Math.round((trainingPlan.totalDuration / 60) * 10) / 10} hours
- Generated: ${trainingPlan.generatedAt}

VALIDATION SCORES:
- Overall: ${validationScores.overallScore}/100
- Coverage: ${validationScores.coverageScore}/100
- Relevance: ${validationScores.relevanceScore}/100
- Completeness: ${validationScores.completenessScore}/100

Please provide:
1. A summary assessment of the training plan
2. Key strengths to acknowledge
3. Areas that need improvement
4. Specific recommendations for enhancement
5. A recommended review decision (approve, needs_revision, or reject) with justification

Format your response as JSON:
{
  "summary": "overall summary of the training plan",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "decision": "approve|needs_revision|reject",
  "justification": "explanation for the recommended decision"
}`;
}
