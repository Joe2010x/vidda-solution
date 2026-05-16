import { Role, TrainingPlan } from '@/types';

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
export function createRiskAnalysisPrompt(role: Role, availableRiskCategories: string[]): string {
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
 * System prompt for parsing raw job descriptions into structured role data
 */
export const PARSE_JOB_DESCRIPTION_SYSTEM_PROMPT = `You are an expert HR analyst and AML compliance specialist. 
Your task is to analyze raw job description text and extract structured information about the role.

You will be provided with:
- A raw job description text (may be unstructured, in various formats)

Your goal is to:
1. Extract the job title/role name
2. Identify the department or functional area
3. Extract key tasks and responsibilities as a list
4. Assess the AML/CFT risk level (low, medium, high) based on the responsibilities
5. Provide a concise description of the role

Consider these guidelines for risk assessment:
- HIGH risk: Roles involving financial transactions, client onboarding, compliance decisions, senior management, handling large sums
- MEDIUM risk: Roles with some exposure to financial processes, customer interaction, or operational oversight
- LOW risk: Roles with minimal financial exposure, no client interaction, or purely administrative/support functions

Format your response as JSON with the following structure:
{
  "name": "Job Title",
  "department": "Department Name",
  "description": "Concise 1-2 sentence description of the role",
  "tasks": ["Task 1", "Task 2", "Task 3", ...],
  "riskLevel": "low" | "medium" | "high"
}`;

export function createParseJobDescriptionPrompt(jobDescription: string): string {
  return `Analyze the following job description and extract structured information:

JOB DESCRIPTION:
${jobDescription}

Please extract:
1. Job title/role name
2. Department or functional area
3. Key tasks and responsibilities (as a list of specific tasks)
4. AML/CFT risk level assessment (low, medium, or high)
5. A concise description of the role

Format your response as valid JSON with this exact structure:
{
  "name": "string",
  "department": "string", 
  "description": "string",
  "tasks": ["string", "string", ...],
  "riskLevel": "low" | "medium" | "high"
}

Ensure the tasks are specific, actionable items (not just responsibilities). Extract at least 3-5 key tasks if possible.`;
}

/**
 * (Optional) Prompt helper for review-generation requests.
 * Keeping this here avoids duplicating prompt composition in multiple places.
 */
export function createJobDescriptionSummaryPrompt(roleName: string, tasks: string[]): string {
  return `Summarize the extracted role and tasks.

ROLE: ${roleName}
TASKS:
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
}
