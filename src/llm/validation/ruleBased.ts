import { Role, AMLRRequirement, TrainingPlan, ValidationScore } from '@/types';
import { amlrRequirements } from '@/data/amlrRequirements';

/**
 * Calculate validation score for a generated training plan (rule-based)
 * Evaluates coverage, relevance, and completeness
 */
export function calculateValidationScoreRuleBased(
  role: Role,
  requirements: AMLRRequirement[],
  trainingPlan: TrainingPlan,
  mappedRisks: string[]
): ValidationScore {
  // 1. Risk Coverage Score: How well does the plan cover the identified risk categories?
  const allRiskCategories = new Set<string>();
  amlrRequirements.forEach((req) => {
    req.riskCategories.forEach((cat) => allRiskCategories.add(cat));
  });

  const coveredRiskCategories = new Set<string>();
  requirements.forEach((req) => {
    req.riskCategories.forEach((cat) => {
      if (mappedRisks.includes(cat)) {
        coveredRiskCategories.add(cat);
      }
    });
  });

  const riskCoverage =
    mappedRisks.length > 0
      ? Math.round((coveredRiskCategories.size / Math.max(mappedRisks.length, 1)) * 100)
      : 100;

  // 2. Competency Coverage Score: Are all competency requirements addressed?
  const allCompetencies = new Set<string>();
  requirements.forEach((req) => {
    req.competencyRequirements.forEach((comp) => allCompetencies.add(comp));
  });

  const coveredCompetencies = new Set<string>();
  trainingPlan.items.forEach((item) => {
    item.module.competencyAreas.forEach((area) => {
      if (allCompetencies.has(area)) {
        coveredCompetencies.add(area);
      }
    });
  });

  const competencyCoverage =
    allCompetencies.size > 0
      ? Math.round((coveredCompetencies.size / allCompetencies.size) * 100)
      : 100;

  // 3. Module Relevance Score: How relevant are the selected modules to the role?
  const roleTaskKeywords = role.tasks
    .join(' ')
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 3);

  let relevanceScoreTotal = 0;
  trainingPlan.items.forEach((item) => {
    const moduleText = `${item.module.title} ${item.module.description}`.toLowerCase();
    let matchCount = 0;
    roleTaskKeywords.forEach((keyword) => {
      if (moduleText.includes(keyword)) {
        matchCount++;
      }
    });
    const relevance = Math.min(100, Math.round((matchCount / Math.max(roleTaskKeywords.length, 1)) * 100));
    relevanceScoreTotal += relevance;
  });

  const moduleRelevance =
    trainingPlan.items.length > 0 ? Math.round(relevanceScoreTotal / trainingPlan.items.length) : 0;

  // Calculate overall scores
  const coverageScore = Math.round((riskCoverage + competencyCoverage) / 2);
  const relevanceScore = moduleRelevance;
  const completenessScore = Math.min(
    100,
    Math.round(
      (requirements.length / amlrRequirements.length) *
        100 *
        (role.riskLevel === 'high' ? 1.2 : role.riskLevel === 'medium' ? 1 : 0.8)
    )
  );

  // Overall score: weighted average
  const overallScore = Math.round(coverageScore * 0.4 + relevanceScore * 0.3 + completenessScore * 0.3);

  return {
    overallScore: Math.min(100, overallScore),
    coverageScore: Math.min(100, coverageScore),
    relevanceScore: Math.min(100, relevanceScore),
    completenessScore: Math.min(100, completenessScore),
    breakdown: {
      riskCoverage,
      competencyCoverage,
      moduleRelevance,
    },
  };
}

/**
 * Get quality assessment summary
 */
export function getQualityAssessment(score: ValidationScore): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'poor';
  recommendations: string[];
} {
  const recommendations: string[] = [];

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let status: 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'poor';

  if (score.overallScore >= 90) {
    grade = 'A';
    status = 'excellent';
  } else if (score.overallScore >= 80) {
    grade = 'B';
    status = 'good';
  } else if (score.overallScore >= 70) {
    grade = 'C';
    status = 'adequate';
  } else if (score.overallScore >= 60) {
    grade = 'D';
    status = 'needs_improvement';
  } else {
    grade = 'F';
    status = 'poor';
  }

  // Generate recommendations based on scores
  if (score.breakdown.riskCoverage < 80) {
    recommendations.push('Consider adding more training modules to cover identified risk categories');
  }

  if (score.breakdown.competencyCoverage < 80) {
    recommendations.push('Additional modules may be needed to address all competency requirements');
  }

  if (score.breakdown.moduleRelevance < 70) {
    recommendations.push('Review module selection to ensure better alignment with role-specific tasks');
  }

  if (score.completenessScore < 70) {
    recommendations.push('Consider expanding the training plan to cover more regulatory requirements');
  }

  if (recommendations.length === 0) {
    recommendations.push('Training plan meets all quality criteria');
  }

  return {
    grade,
    status,
    recommendations,
  };
}
