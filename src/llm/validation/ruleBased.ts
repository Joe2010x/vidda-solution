import { Role, AMLRRequirement, TrainingPlan, ValidationScore } from '@/types';
import { amlrRequirements } from '@/data/amlrRequirements';

/**
 * Calculate validation score for a generated training plan (rule-based)
 * Uses enhanced weighted scoring:
 * overallScore = 0.30 * riskCoverage + 0.25 * regulatoryTraceability + 
 *                0.20 * competencyCoverage + 0.15 * humanReviewReadiness + 0.10 * lmsReadiness
 */
export function calculateValidationScoreRuleBased(
  role: Role,
  requirements: AMLRRequirement[],
  trainingPlan: TrainingPlan,
  mappedRisks: string[]
): ValidationScore {
  // 1. Risk Coverage Score (30% weight): How well does the plan cover the identified risk categories?
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

  // 2. Regulatory Traceability Score (25% weight): How well are requirements traced to AMLR articles?
  const traceabilityScores: number[] = [];
  requirements.forEach((req) => {
    let score = 0;
    // Has article reference (40% of traceability)
    if (req.article) score += 40;
    // Has source excerpt (30% of traceability)
    if (req.sourceExcerpt && req.sourceExcerpt.length > 20) score += 30;
    // Has confidence score above threshold (30% of traceability)
    if (req.confidence && req.confidence >= 0.7) score += 30;
    traceabilityScores.push(score);
  });

  const regulatoryTraceability =
    traceabilityScores.length > 0
      ? Math.round(traceabilityScores.reduce((a, b) => a + b, 0) / traceabilityScores.length)
      : 0;

  // 3. Competency Coverage Score (20% weight): Are all competency requirements addressed?
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

  // 4. Human Review Readiness Score (15% weight): Is the plan ready for human review?
  let humanReviewScore = 100;
  
  // Penalty for low confidence requirements
  const lowConfidenceReqs = requirements.filter(req => req.confidence && req.confidence < 0.7);
  if (lowConfidenceReqs.length > 0) {
    humanReviewScore -= Math.min(30, lowConfidenceReqs.length * 10);
  }
  
  // Penalty for missing articles
  const missingArticles = requirements.filter(req => !req.article);
  if (missingArticles.length > 0) {
    humanReviewScore -= Math.min(20, missingArticles.length * 5);
  }
  
  // Bonus for having training plan items
  if (trainingPlan.items.length > 0) {
    humanReviewScore = Math.min(100, humanReviewScore + 10);
  }
  
  const humanReviewReadiness = Math.max(0, humanReviewScore);

  // 5. LMS Readiness Score (10% weight): Is the plan ready for LMS assignment?
  let lmsScore = 50; // Base score
  
  // Bonus for having complete training plan
  if (trainingPlan.items.length >= 3) lmsScore += 20;
  if (trainingPlan.totalDuration > 0) lmsScore += 15;
  if (trainingPlan.roleName && trainingPlan.roleName.length > 0) lmsScore += 15;
  
  const lmsReadiness = Math.min(100, lmsScore);

  // 4. Module Relevance Score: How relevant are the selected modules to the role?
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

  // Calculate completeness score
  const completenessScore = Math.min(
    100,
    Math.round(
      (requirements.length / amlrRequirements.length) *
        100 *
        (role.riskLevel === 'high' ? 1.2 : role.riskLevel === 'medium' ? 1 : 0.8)
    )
  );

  // Calculate coverage score (average of risk and competency coverage)
  const coverageScore = Math.round((riskCoverage + competencyCoverage) / 2);

  // ENHANCED OVERALL SCORE CALCULATION
  // overallScore = 0.30 * riskCoverage + 0.25 * regulatoryTraceability + 
  //                0.20 * competencyCoverage + 0.15 * humanReviewReadiness + 0.10 * lmsReadiness
  const overallScore = Math.round(
    0.30 * riskCoverage +
    0.25 * regulatoryTraceability +
    0.20 * competencyCoverage +
    0.15 * humanReviewReadiness +
    0.10 * lmsReadiness
  );

  return {
    overallScore: Math.min(100, overallScore),
    coverageScore: Math.min(100, coverageScore),
    relevanceScore: moduleRelevance,
    completenessScore: Math.min(100, completenessScore),
    breakdown: {
      riskCoverage: Math.min(100, riskCoverage),
      competencyCoverage: Math.min(100, competencyCoverage),
      moduleRelevance,
      regulatoryTraceability: Math.min(100, regulatoryTraceability),
      humanReviewReadiness: Math.min(100, humanReviewReadiness),
      lmsReadiness: Math.min(100, lmsReadiness),
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

  if (score.breakdown.regulatoryTraceability && score.breakdown.regulatoryTraceability < 70) {
    recommendations.push('Improve regulatory traceability by adding AMLR article references');
  }

  if (score.breakdown.humanReviewReadiness && score.breakdown.humanReviewReadiness < 70) {
    recommendations.push('Address low-confidence mappings before human review');
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