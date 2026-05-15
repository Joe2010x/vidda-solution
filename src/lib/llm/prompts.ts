/**
 * Prompt templates for LLM-powered features
 * These prompts are designed to work with Google Gemini models via OpenRouter
 */

import { Role, AMLRRequirement, TrainingModule, TrainingPlan } from '@/types';

/**
 * System prompt for risk analysis
 */
export const RISK_ANALYSIS_SYSTEM_PROMPT = `You are an expert AML (Anti-Money Laundering) compliance analyst. 
Your task is to analyze job roles and identify relevant risk categories based on their tasks and responsibilities.

You will be provided with:
- A job role with its description and tasks
- A list of possible risk categories

Your goal is to:
1. Analyze each task in the context of AML/CFT (Combating the Financing of Terrorism) regulations
2. Identify which risk categories are relevant to each task
3. Provide a confidence score (0-100) for each identified risk
4. Explain your reasoning clearly

Be thorough and consider both direct and indirect risk implications.
Focus on regulatory compliance requirements and potential money laundering/terrorist financing risks.`;

/**
 * User prompt template for risk analysis
 */
export function createRiskAnalysisPrompt(
  role: Role,
  availableRiskCategories: string[]
): string {
  return `Analyze the following job role and identify relevant AML/CFT risk categories:

ROLE: ${role.name}
DESCRIPTION: ${role.description}
RISK LEVEL: ${role.riskLevel}
DEPARTMENT: ${role.department}

TASKS:
${role.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}

AVAILABLE RISK CATEGORIES:
${availableRiskCategories.map((cat, index) => `${index + 1}. ${cat}`).join('\n')}

Please analyze each task and identify which risk categories are relevant. For each identified risk:
1. List the relevant risk categories
2. Provide a confidence score (0-100) for each category
3. Explain why each category is relevant to the specific tasks
4. Note any additional risks not in the provided list that you think are important

Format your response as JSON with the following structure:
{
  "identifiedRisks": [
    {
      "category": "risk-category-name",
      "confidence": 85,
      "relatedTasks": ["task 1", "task 2"],
      "reasoning": "explanation of why this risk is relevant"
    }
  ],
  "additionalRisks": ["any additional risks not in the list"],
  "overallRiskAssessment": "summary of the overall risk profile"
}`;
}

/**
 * System prompt for training plan generation
 */
export const TRAINING_PLAN_SYSTEM_PROMPT = `You are an expert AML compliance training designer. 
Your task is to create optimized training plans based on role requirements and regulatory obligations.

You will be provided with:
- A job role with its tasks and risk level
- Relevant regulatory requirements
- Available training modules
- Identified risk categories

Your goal is to:
1. Select the most appropriate training modules for the role
2. Prioritize them based on risk level and regulatory importance
3. Provide clear justifications for each selection
4. Suggest an optimal learning sequence
5. Estimate realistic completion times

Consider:
- Regulatory urgency and importance
- Role-specific relevance
- Learning progression (foundational to advanced)
- Practical application of knowledge
- Time efficiency`;

/**
 * User prompt template for training plan generation
 */
export function createTrainingPlanPrompt(
  role: Role,
  requirements: AMLRRequirement[],
  modules: TrainingModule[],
  riskCategories: string[]
): string {
  return `Create an optimized AML compliance training plan for the following role:

ROLE INFORMATION:
- Name: ${role.name}
- Description: ${role.description}
- Risk Level: ${role.riskLevel}
- Department: ${role.department}

KEY TASKS:
${role.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}

IDENTIFIED RISK CATEGORIES:
${riskCategories.map((cat, index) => `${index + 1}. ${cat}`).join('\n')}

REGULATORY REQUIREMENTS:
${requirements.map((req, index) => `${index + 1}. ${req.title}: ${req.description} (Risk categories: ${req.riskCategories.join(', ')})`).join('\n')}

AVAILABLE TRAINING MODULES:
${modules.map((mod, index) => `${index + 1}. ${mod.title} (${mod.duration} min, ${mod.priority} priority, ${mod.type}): ${mod.description}`).join('\n')}

Please create a comprehensive training plan that:
1. Selects the most relevant modules for this role
2. Prioritizes them (1-10 scale, where 10 is highest priority)
3. Provides justification for each selection
4. Suggests an optimal learning sequence
5. Estimates total completion time
6. Highlights any critical modules that must be completed first

Format your response as JSON with the following structure:
{
  "selectedModules": [
    {
      "moduleId": "mod-xxx",
      "priority": 9,
      "sequence": 1,
      "justification": "why this module is important for this role",
      "estimatedDuration": 45,
      "prerequisites": []
    }
  ],
  "totalDuration": 180,
  "criticalPath": ["mod-xxx", "mod-yyy"],
  "learningObjectives": ["objective 1", "objective 2"],
  "recommendations": "additional recommendations for this training plan"
}`;
}

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
- Duration: ${Math.round(trainingPlan.totalDuration / 60 * 10) / 10} hours
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