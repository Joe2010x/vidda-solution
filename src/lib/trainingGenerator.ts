import {
  Role,
  AMLRRequirement,
  TrainingPlan,
  TrainingPlanItem,
  TrainingModule,
} from "@/types";
import { trainingModules } from "@/data/amirRequirements";

/**
 * Generate a training plan based on role and retrieved requirements
 */
export function generateTrainingPlan(
  role: Role,
  requirements: AMLRRequirement[]
): TrainingPlan {
  const items: TrainingPlanItem[] = [];

  // For each requirement, map the associated training modules
  requirements.forEach((req) => {
    req.trainingModuleIds.forEach((moduleId) => {
      const module = trainingModules.find((m) => m.id === moduleId);
      if (module) {
        // Calculate priority based on:
        // 1. Module priority (high=3, medium=2, low=1)
        // 2. Role risk level (high=3, medium=2, low=1)
        const modulePriorityScore =
          module.priority === "high" ? 3 : module.priority === "medium" ? 2 : 1;
        const roleRiskScore =
          role.riskLevel === "high" ? 3 : role.riskLevel === "medium" ? 2 : 1;

        // Combined priority (1-10 scale)
        const priority = Math.min(10, Math.round((modulePriorityScore * roleRiskScore * 10) / 9));

        items.push({
          module,
          requirement: req,
          priority,
          estimatedDuration: module.duration,
        });
      }
    });
  });

  // Remove duplicates (same module might be linked to multiple requirements)
  const uniqueItems = items.reduce((acc, item) => {
    const existing = acc.find((i) => i.module.id === item.module.id);
    if (existing) {
      // Keep the higher priority one
      if (item.priority > existing.priority) {
        acc[acc.indexOf(existing)] = item;
      }
    } else {
      acc.push(item);
    }
    return acc;
  }, [] as TrainingPlanItem[]);

  // Sort by priority (highest first)
  uniqueItems.sort((a, b) => b.priority - a.priority);

  // Calculate total duration
  const totalDuration = uniqueItems.reduce(
    (sum, item) => sum + item.estimatedDuration,
    0
  );

  return {
    roleId: role.id,
    roleName: role.name,
    items: uniqueItems,
    totalDuration,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get a summary of the training plan
 */
export function getTrainingPlanSummary(plan: TrainingPlan): {
  totalModules: number;
  totalDurationHours: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  moduleTypes: Record<string, number>;
} {
  const highPriorityCount = plan.items.filter(
    (item) => item.priority >= 7
  ).length;
  const mediumPriorityCount = plan.items.filter(
    (item) => item.priority >= 4 && item.priority < 7
  ).length;
  const lowPriorityCount = plan.items.filter((item) => item.priority < 4)
    .length;

  const moduleTypes: Record<string, number> = {};
  plan.items.forEach((item) => {
    moduleTypes[item.module.type] = (moduleTypes[item.module.type] || 0) + 1;
  });

  return {
    totalModules: plan.items.length,
    totalDurationHours: Math.round((plan.totalDuration / 60) * 10) / 10,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    moduleTypes,
  };
}