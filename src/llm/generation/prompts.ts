import { Role, AMLRRequirement, TrainingModule, TrainingPlan } from '@/types';

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
