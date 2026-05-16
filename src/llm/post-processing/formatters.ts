import type { RiskAnalysisResult } from '../extraction/riskAnalyzer';
import type { LLMTrainingPlan } from '../generation/planGenerator';
import type { LLMValidationAnalysis, ReviewAssessment } from '../validation/validator';

/**
 * Get detailed risk analysis explanation for UI display
 */
export function formatRiskAnalysisForDisplay(analysis: RiskAnalysisResult): string {
  if (!analysis.identifiedRisks.length) {
    return 'No risk analysis available';
  }

  let output = `**Overall Assessment:** ${analysis.overallRiskAssessment}\n\n`;
  output += `**Identified Risk Categories:**\n`;

  analysis.identifiedRisks
    .sort((a, b) => b.confidence - a.confidence)
    .forEach((risk, index) => {
      output += `${index + 1}. **${risk.category}** (Confidence: ${risk.confidence}%)\n`;
      output += `   Related tasks: ${risk.relatedTasks.join(', ')}\n`;
      output += `   Reasoning: ${risk.reasoning}\n\n`;
    });

  if (analysis.additionalRisks.length > 0) {
    output += `**Additional Risks to Consider:**\n`;
    analysis.additionalRisks.forEach((risk) => {
      output += `- ${risk}\n`;
    });
  }

  return output;
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

/**
 * Format LLM validation analysis for display
 */
export function formatLLMValidationForDisplay(analysis: LLMValidationAnalysis): string {
  let output = `**Grade: ${analysis.grade}** (${analysis.status.toUpperCase()})\n\n`;

  output += `**Scores:**\n`;
  output += `- Coverage: ${analysis.scores.coverage}/100\n`;
  output += `- Relevance: ${analysis.scores.relevance}/100\n`;
  output += `- Completeness: ${analysis.scores.completeness}/100\n`;
  output += `- Overall: ${analysis.scores.overall}/100\n\n`;

  if (analysis.analysis.strengths.length > 0) {
    output += `**Strengths:**\n`;
    analysis.analysis.strengths.forEach((strength, i) => {
      output += `${i + 1}. ${strength}\n`;
    });
    output += '\n';
  }

  if (analysis.analysis.weaknesses.length > 0) {
    output += `**Areas for Improvement:**\n`;
    analysis.analysis.weaknesses.forEach((weakness, i) => {
      output += `${i + 1}. ${weakness}\n`;
    });
    output += '\n';
  }

  if (analysis.analysis.gaps.length > 0) {
    output += `**Identified Gaps:**\n`;
    analysis.analysis.gaps.forEach((gap, i) => {
      output += `${i + 1}. ${gap}\n`;
    });
    output += '\n';
  }

  if (analysis.recommendations.length > 0) {
    output += `**Recommendations:**\n`;
    analysis.recommendations.forEach((rec, i) => {
      output += `${i + 1}. ${rec}\n`;
    });
  }

  return output;
}

/**
 * Format review assessment for display
 */
export function formatReviewAssessmentForDisplay(assessment: ReviewAssessment): string {
  let output = `**Summary:** ${assessment.summary}\n\n`;

  output += `**Recommended Decision:** ${assessment.decision.toUpperCase()}\n`;
  output += `**Justification:** ${assessment.justification}\n\n`;

  if (assessment.strengths.length > 0) {
    output += `**Strengths:**\n`;
    assessment.strengths.forEach((strength, i) => {
      output += `${i + 1}. ${strength}\n`;
    });
    output += '\n';
  }

  if (assessment.improvements.length > 0) {
    output += `**Areas for Improvement:**\n`;
    assessment.improvements.forEach((improvement, i) => {
      output += `${i + 1}. ${improvement}\n`;
    });
    output += '\n';
  }

  if (assessment.recommendations.length > 0) {
    output += `**Specific Recommendations:**\n`;
    assessment.recommendations.forEach((rec, i) => {
      output += `${i + 1}. ${rec}\n`;
    });
  }

  return output;
}
