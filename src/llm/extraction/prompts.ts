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
 * Enhanced system prompt for parsing raw job descriptions into structured role-risk profiles
 */
export const PARSE_JOB_DESCRIPTION_SYSTEM_PROMPT = `You are an expert HR analyst and AML/CFT compliance specialist. 
Your task is to analyze raw job description text and extract a comprehensive role-risk profile that will be used for AML training plan generation.

You will be provided with:
- A raw job description text (may be unstructured, in various formats)

Your goal is to:
1. Extract the job title/role name and department
2. Assess seniority level and management responsibility
3. Extract key tasks with evidence text and risk hints for each
4. Assess overall AML/CFT risk level with detailed justification
5. Identify ambiguity flags and clarifying questions if needed
6. Provide a confidence score for your analysis

RISK ASSESSMENT GUIDELINES:

HIGH risk roles:
- Approve or reject customers/transactions
- Handle high-risk onboarding, EDD, SAR, sanctions, PEP/adverse media
- Own AML framework, MLRO/compliance officer responsibility
- Make escalation or regulatory reporting decisions

MEDIUM risk roles:
- Collect/verify customer documents
- Handle customer contact with fraud/AML red-flag exposure
- Update customer records or support periodic reviews
- Identify and escalate suspicious activity but do not decide final outcome

LOW risk roles:
- Generic admin/support with no customer onboarding
- No transaction exposure, no compliance decision-making

FUNCTION TYPES for tasks:
- customer_onboarding: Activities related to onboarding new customers
- transaction_monitoring: Monitoring and analyzing transactions for suspicious activity
- kyc_due_diligence: Customer identification, verification, and due diligence
- investigation: Investigating alerts, cases, or suspicious activities
- escalation: Escalating issues to compliance or management
- reporting: Regulatory reporting, SAR filing, management reporting
- governance: Policy development, oversight, compliance management
- data_handling: Handling customer data, record keeping, documentation
- training_oversight: Training other staff on compliance matters
- other: Tasks that don't fit other categories

RISK HINT CATEGORIES:
- AML: Anti-money laundering risks
- KYC: Know your customer risks
- sanctions: Sanctions compliance risks
- fraud: Fraud detection and prevention risks
- documentation: Documentation and record-keeping risks
- data_protection: Data privacy and protection risks
- governance: Governance and oversight risks

Format your response as valid JSON. CRITICAL: Include the original text evidence for each task extraction.`;

export function createParseJobDescriptionPrompt(jobDescription: string): string {
  return `Analyze the following job description and create a comprehensive role-risk profile:

JOB DESCRIPTION:
${jobDescription}

Please provide your analysis in the following JSON format:

{
  "roleName": "Job Title",
  "department": "Department Name or null if unclear",
  "seniority": "junior" | "mid" | "senior" | "manager" | "executive" | "unknown",
  "managementResponsibility": true | false | "unknown",
  "roleSummary": "2-3 sentence summary of the role's purpose and key responsibilities",
  "tasks": [
    {
      "taskId": "task-1",
      "description": "Clear description of the task",
      "evidenceText": "EXACT quote from the JD that supports this task extraction",
      "riskHints": [
        {
          "category": "AML" | "KYC" | "sanctions" | "fraud" | "documentation" | "data_protection" | "governance",
          "level": "low" | "medium" | "high",
          "reason": "Why this task has this risk hint"
        }
      ],
      "functionType": "customer_onboarding" | "transaction_monitoring" | "kyc_due_diligence" | "investigation" | "escalation" | "reporting" | "governance" | "data_handling" | "training_oversight" | "other"
    }
  ],
  "overallRiskLevel": "low" | "medium" | "high",
  "riskCategories": ["AML", "KYC", ...],
  "ambiguityFlags": [
    {
      "field": "which field is ambiguous",
      "issue": "description of the ambiguity",
      "suggestedQuestion": "question to clarify this"
    }
  ],
  "confidence": 0.85,
  "needsClarification": true | false,
  "clarifyingQuestions": ["Question 1", "Question 2"]
}

IMPORTANT REQUIREMENTS:
1. Extract at least 3-5 specific tasks from the JD
2. For EACH task, include the exact evidenceText (quote from JD)
3. For EACH task, identify relevant risk hints with level and reason
4. Assign appropriate functionType to each task
5. If the JD is unclear about risk level, set confidence lower and add ambiguity flags
6. If riskLevel would be defaulted due to unclear information, add an ambiguity flag instead of silently defaulting
7. Overall risk level must be justified by the task-level risk hints
8. If overallRiskLevel is "high", at least one task must have a "high" level risk hint
9. Provide clarifying questions if the JD lacks detail about AML-relevant responsibilities

Focus on AML/CFT relevance - prioritize tasks that involve customer interaction, financial transactions, compliance decisions, or regulatory requirements.`;
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
