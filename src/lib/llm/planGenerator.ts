/**
 * LLM-powered training plan generation service
 * Enhances the rule-based plan generation with AI-powered optimization
 */

import { Role, AMLRRequirement, TrainingModule, TrainingPlan, TrainingPlanItem } from '@/types';
import { getLLMClient, LLMMessage } from './client';
import { 
  TRAINING_PLAN_SYSTEM_PROMPT, 
  createTrainingPlanPrompt 
} from './prompts';
import { trainingModules } from '@/data/amirRequirements';
import { parseJSONFromLLM } from './parseJson';

export interface LLMSelectedModule {
  moduleId: string;
  priority: number;
  sequence: number;
  justification: string;
  estimatedDuration: number;
  prerequisites: string[];
}

export interface LLMTrainingPlan {
  selectedModules: LLMSelectedModule[];
  totalDuration: number;
  criticalPath: string[];
  learningObjectives: string[];
  recommendations: string;
}

export interface EnhancedTrainingPlan {
  plan: TrainingPlan;
  llmAnalysis: LLMTrainingPlan;
  fallbackUsed: boolean;
}

/**
 * Generate a training plan using LLM optimization
 * Falls back to rule-based generation if LLM fails
 */
export async function generateTrainingPlanWithLLM(
  role: Role,
  requirements: AMLRRequirement[],
  riskCategories: string[]
): Promise<EnhancedTrainingPlan> {
  try {
    const client = getLLMClient();
    
    const systemMessage: LLMMessage = {
      role: 'system',
      content: TRAINING_PLAN_SYSTEM_PROMPT,
    };

    const userMessage: LLMMessage = {
      role: 'user',
      content: createTrainingPlanPrompt(role, requirements, trainingModules, riskCategories),
    };

    const response = await client.chat([systemMessage, userMessage]);
    const llmPlan = parseJSONFromLLM<LLMTrainingPlan>(
      response.choices[0]?.message.content || '',
      {
        selectedModules: [],
        totalDuration: 0,
        criticalPath: [],
        learningObjectives: [],
        recommendations: '',
      }
    );

    // Convert LLM-selected modules to TrainingPlan format
    const items: TrainingPlanItem[] = [];
    
    llmPlan.selectedModules.forEach((selectedModule) => {
      const module = trainingModules.find((m) => m.id === selectedModule.moduleId);
      if (module) {
        const requirement = requirements.find((req) =>
          req.trainingModuleIds.includes(module.id)
        );

        if (requirement) {
          items.push({
            module,
            requirement,
            priority: Math.min(10, Math.max(1, selectedModule.priority)),
            estimatedDuration: selectedModule.estimatedDuration || module.duration,
          });
        }
      }
    });

    // If LLM didn't select enough modules, supplement with rule-based selection
    if (items.length < requirements.length) {
      const existingModuleIds = new Set(items.map((item) => item.module.id));
      
      requirements.forEach((req) => {
        req.trainingModuleIds.forEach((moduleId) => {
          if (!existingModuleIds.has(moduleId)) {
            const module = trainingModules.find((m) => m.id === moduleId);
            if (module) {
              const modulePriorityScore =
                module.priority === 'high' ? 3 : module.priority === 'medium' ? 2 : 1;
              const roleRiskScore =
                role.riskLevel === 'high' ? 3 : role.riskLevel === 'medium' ? 2 : 1;
              const priority = Math.min(10, Math.round((modulePriorityScore * roleRiskScore * 10) / 9));

              items.push({
                module,
                requirement: req,
                priority,
                estimatedDuration: module.duration,
              });
            }
          }
        });
      });
    }

    // Sort by priority (highest first)
    items.sort((a, b) => b.priority - a.priority);

    // Calculate total duration
    const totalDuration = items.reduce((sum, item) => sum + item.estimatedDuration, 0);

    const trainingPlan: TrainingPlan = {
      roleId: role.id,
      roleName: role.name,
      items,
      totalDuration,
      generatedAt: new Date().toISOString(),
    };

    return {
      plan: trainingPlan,
      llmAnalysis: llmPlan,
      fallbackUsed: false,
    };
  } catch (error) {
    console.error('LLM training plan generation failed, using fallback:', error);
    
    // Use the original rule-based generation
    const { generateTrainingPlan } = await import('../trainingGenerator');
    const fallbackPlan = generateTrainingPlan(role, requirements);
    
    return {
      plan: fallbackPlan,
      llmAnalysis: {
        selectedModules: [],
        totalDuration: fallbackPlan.totalDuration,
        criticalPath: [],
        learningObjectives: [],
        recommendations: 'Plan generated using rule-based fallback',
      },
      fallbackUsed: true,
    };
  }
}

/**
 * Get enhanced training plan with LLM insights
 * This version uses LLM to enhance the existing rule-based plan
 */
export async function enhanceTrainingPlanWithLLM(
  role: Role,
  requirements: AMLRRequirement[],
  existingPlan: TrainingPlan,
  riskCategories: string[]
): Promise<{
  enhancedPlan: TrainingPlan;
  llmRecommendations: string;
  learningObjectives: string[];
}> {
  try {
    const client = getLLMClient();
    
    // Create a prompt to enhance the existing plan
    const prompt = `Review and enhance the following AML compliance training plan:

ROLE: ${role.name} (${role.riskLevel} risk level)
DEPARTMENT: ${role.department}

CURRENT TRAINING PLAN:
${existingPlan.items.map((item, i) => `${i + 1}. ${item.module.title} (Priority: ${item.priority}/10, Duration: ${item.estimatedDuration} min)`).join('\n')}

RISK CATEGORIES: ${riskCategories.join(', ')}

REGULATORY REQUIREMENTS:
${requirements.map((req) => `- ${req.title}: ${req.description}`).join('\n')}

Please provide:
1. Any additional modules that should be included
2. Priority adjustments with justification
3. Learning objectives for this role
4. Recommendations for improving the plan

Format your response as JSON:
{
  "additionalModules": [{"moduleId": "mod-xxx", "priority": 8, "justification": "reason"}],
  "priorityAdjustments": [{"moduleId": "mod-xxx", "newPriority": 9, "reason": "explanation"}],
  "learningObjectives": ["objective 1", "objective 2"],
  "recommendations": "detailed recommendations"
}`;

    const response = await client.generateResponse(prompt, TRAINING_PLAN_SYSTEM_PROMPT);
    const enhancement = parseJSONFromLLM<{
      additionalModules: Array<{ moduleId: string; priority: number; justification: string }>;
      priorityAdjustments: Array<{ moduleId: string; newPriority: number; reason: string }>;
      learningObjectives: string[];
      recommendations: string;
    }>(response, {
      additionalModules: [],
      priorityAdjustments: [],
      learningObjectives: [],
      recommendations: '',
    });

    // Apply enhancements to the plan
    const enhancedItems = [...existingPlan.items];

    // Add priority adjustments
    enhancement.priorityAdjustments.forEach((adjustment) => {
      const item = enhancedItems.find((i) => i.module.id === adjustment.moduleId);
      if (item) {
        item.priority = Math.min(10, Math.max(1, adjustment.newPriority));
      }
    });

    // Add additional modules
    enhancement.additionalModules.forEach((additional) => {
      const module = trainingModules.find((m) => m.id === additional.moduleId);
      if (module && !enhancedItems.find((i) => i.module.id === additional.moduleId)) {
        const requirement = requirements.find((req) =>
          req.trainingModuleIds.includes(module.id)
        );
        if (requirement) {
          enhancedItems.push({
            module,
            requirement,
            priority: additional.priority,
            estimatedDuration: module.duration,
          });
        }
      }
    });

    // Re-sort by priority
    enhancedItems.sort((a, b) => b.priority - a.priority);

    // Recalculate total duration
    const newTotalDuration = enhancedItems.reduce((sum, item) => sum + item.estimatedDuration, 0);

    const enhancedPlan: TrainingPlan = {
      roleId: role.id,
      roleName: role.name,
      items: enhancedItems,
      totalDuration: newTotalDuration,
      generatedAt: new Date().toISOString(),
    };

    return {
      enhancedPlan,
      llmRecommendations: enhancement.recommendations,
      learningObjectives: enhancement.learningObjectives,
    };
  } catch (error) {
    console.error('LLM plan enhancement failed:', error);
    return {
      enhancedPlan: existingPlan,
      llmRecommendations: 'Plan enhancement failed - using original plan',
      learningObjectives: [],
    };
  }
}

/**
 * Format LLM training plan analysis for display
 */
export function formatLLMPlanAnalysisForDisplay(analysis: LLMTrainingPlan): string {
  if (!analysis.selectedModules.length) {
    return 'No LLM analysis available';
  }

  let output = `**Learning Objectives:**\n`;
  analysis.learningObjectives.forEach((obj, i) => {
    output += `${i + 1}. ${obj}\n`;
  });

  output += `\n**Recommended Learning Sequence:**\n`;
  analysis.selectedModules
    .sort((a, b) => a.sequence - b.sequence)
    .forEach((module, i) => {
      output += `${i + 1}. Module ${module.moduleId} (Priority: ${module.priority}/10)\n`;
      output += `   Justification: ${module.justification}\n`;
      if (module.prerequisites.length > 0) {
        output += `   Prerequisites: ${module.prerequisites.join(', ')}\n`;
      }
    });

  if (analysis.criticalPath.length > 0) {
    output += `\n**Critical Path:** ${analysis.criticalPath.join(' → ')}\n`;
  }

  if (analysis.recommendations) {
    output += `\n**AI Recommendations:**\n${analysis.recommendations}\n`;
  }

  return output;
}