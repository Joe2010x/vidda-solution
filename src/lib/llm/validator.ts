/**
 * LLM-powered validation and quality assessment service
 * Enhances the rule-based validation with AI-powered qualitative analysis
 */

import { Role, AMLRRequirement, TrainingPlan, ValidationScore } from '@/types';
import { getLLMClient, LLMMessage } from './client';
import { 
  VALIDATION_SYSTEM_PROMPT,
  REVIEW_ASSISTANT_SYSTEM_PROMPT,
  createValidationPrompt,
  createReviewCommentPrompt
} from './prompts';
import { parseJSONFromLLM } from './parseJson';

export interface LLMValidationAnalysis {
  scores: {
    coverage: number;
    relevance: number;
    completeness: number;
    overall: number;
  };
  analysis: {
    strengths: string[];
    weaknesses: string[];
    gaps: string[];
  };
  recommendations: string[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'poor';
}

export interface EnhancedValidationResult {
  validationScore: ValidationScore;
  llmAnalysis: LLMValidationAnalysis;
  fallbackUsed: boolean;
}

export interface ReviewAssessment {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  decision: 'approve' | 'needs_revision' | 'reject';
  justification: string;
}

/**
 * Convert LLM grade to numeric score range
 */
function gradeToScoreRange(grade: string): { min: number; max: number } {
  switch (grade) {
    case 'A': return { min: 90, max: 100 };
    case 'B': return { min: 80, max: 89 };
    case 'C': return { min: 70, max: 79 };
    case 'D': return { min: 60, max: 69 };
    case 'F': return { min: 0, max: 59 };
    default: return { min: 70, max: 79 };
  }
}

/**
 * Convert LLM status to standard status
 */
function normalizeStatus(status: string): 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'poor' {
  const validStatuses = ['excellent', 'good', 'adequate', 'needs_improvement', 'poor'] as const;
  if (validStatuses.includes(status as typeof validStatuses[number])) {
    return status as typeof validStatuses[number];
  }
  return 'adequate';
}

/**
 * Validate a training plan using LLM analysis
 * Provides qualitative insights in addition to quantitative scores
 */
export async function validateWithLLM(
  role: Role,
  requirements: AMLRRequirement[],
  trainingPlan: TrainingPlan,
  riskCategories: string[]
): Promise<EnhancedValidationResult> {
  try {
    const client = getLLMClient();
    
    const systemMessage: LLMMessage = {
      role: 'system',
      content: VALIDATION_SYSTEM_PROMPT,
    };

    const userMessage: LLMMessage = {
      role: 'user',
      content: createValidationPrompt(role, trainingPlan, requirements, riskCategories),
    };

    const response = await client.chat([systemMessage, userMessage]);
    const llmAnalysis = parseJSONFromLLM<LLMValidationAnalysis>(
      response.choices[0]?.message.content || '',
      {
        scores: { coverage: 70, relevance: 70, completeness: 70, overall: 70 },
        analysis: { strengths: [], weaknesses: [], gaps: [] },
        recommendations: [],
        grade: 'C',
        status: 'adequate',
      }
    );

    // Convert LLM scores to ValidationScore format
    const validationScore: ValidationScore = {
      overallScore: llmAnalysis.scores.overall,
      coverageScore: llmAnalysis.scores.coverage,
      relevanceScore: llmAnalysis.scores.relevance,
      completenessScore: llmAnalysis.scores.completeness,
      breakdown: {
        riskCoverage: llmAnalysis.scores.coverage,
        competencyCoverage: Math.round((llmAnalysis.scores.relevance + llmAnalysis.scores.completeness) / 2),
        moduleRelevance: llmAnalysis.scores.relevance,
      },
    };

    return {
      validationScore,
      llmAnalysis,
      fallbackUsed: false,
    };
  } catch (error) {
    console.error('LLM validation failed, using fallback:', error);
    
    // Use the original rule-based validation
    const { calculateValidationScore } = await import('../validation');
    const fallbackScore = calculateValidationScore(role, requirements, trainingPlan, riskCategories);
    
    return {
      validationScore: fallbackScore,
      llmAnalysis: {
        scores: {
          coverage: fallbackScore.breakdown.riskCoverage,
          relevance: fallbackScore.breakdown.moduleRelevance,
          completeness: fallbackScore.completenessScore,
          overall: fallbackScore.overallScore,
        },
        analysis: {
          strengths: ['Automated validation completed'],
          weaknesses: [],
          gaps: [],
        },
        recommendations: ['Using rule-based validation'],
        grade: fallbackScore.overallScore >= 90 ? 'A' : fallbackScore.overallScore >= 80 ? 'B' : fallbackScore.overallScore >= 70 ? 'C' : fallbackScore.overallScore >= 60 ? 'D' : 'F',
        status: fallbackScore.overallScore >= 90 ? 'excellent' : fallbackScore.overallScore >= 80 ? 'good' : fallbackScore.overallScore >= 70 ? 'adequate' : fallbackScore.overallScore >= 60 ? 'needs_improvement' : 'poor',
      },
      fallbackUsed: true,
    };
  }
}

/**
 * Generate AI-powered review comments for a training plan
 * Helps human reviewers by providing initial assessment
 */
export async function generateReviewAssessment(
  role: Role,
  trainingPlan: TrainingPlan,
  validationScores: ValidationScore
): Promise<ReviewAssessment> {
  try {
    const client = getLLMClient();
    
    const systemMessage: LLMMessage = {
      role: 'system',
      content: REVIEW_ASSISTANT_SYSTEM_PROMPT,
    };

    const userMessage: LLMMessage = {
      role: 'user',
      content: createReviewCommentPrompt(role, trainingPlan, validationScores),
    };

    const response = await client.chat([systemMessage, userMessage]);
    const assessment = parseJSONFromLLM<ReviewAssessment>(
      response.choices[0]?.message.content || '',
      {
        summary: 'Review assessment could not be generated',
        strengths: [],
        improvements: [],
        recommendations: [],
        decision: 'needs_revision',
        justification: 'Using default assessment due to generation failure',
      }
    );

    return assessment;
  } catch (error) {
    console.error('LLM review assessment failed:', error);
    
    // Return a basic assessment
    return {
      summary: `Training plan for ${role.name} has been evaluated with an overall score of ${validationScores.overallScore}/100.`,
      strengths: ['Automated validation completed'],
      improvements: ['Manual review recommended'],
      recommendations: ['Review the validation scores and provide feedback'],
      decision: 'needs_revision',
      justification: 'Review assessment generation failed - manual review required',
    };
  }
}

/**
 * Combine rule-based and LLM validation for comprehensive assessment
 */
export async function comprehensiveValidation(
  role: Role,
  requirements: AMLRRequirement[],
  trainingPlan: TrainingPlan,
  riskCategories: string[]
): Promise<{
  combinedScore: ValidationScore;
  llmAnalysis: LLMValidationAnalysis;
  reviewAssessment: ReviewAssessment;
  fallbackUsed: boolean;
}> {
  try {
    // Get both rule-based and LLM validation
    const { calculateValidationScore } = await import('../validation');
    const ruleBasedScore = calculateValidationScore(role, requirements, trainingPlan, riskCategories);
    
    const llmResult = await validateWithLLM(role, requirements, trainingPlan, riskCategories);
    
    // Combine scores (weighted average: 60% LLM, 40% rule-based for more nuanced assessment)
    const combinedScore: ValidationScore = {
      overallScore: Math.round(llmResult.validationScore.overallScore * 0.6 + ruleBasedScore.overallScore * 0.4),
      coverageScore: Math.round(llmResult.validationScore.coverageScore * 0.6 + ruleBasedScore.coverageScore * 0.4),
      relevanceScore: Math.round(llmResult.validationScore.relevanceScore * 0.6 + ruleBasedScore.relevanceScore * 0.4),
      completenessScore: Math.round(llmResult.validationScore.completenessScore * 0.6 + ruleBasedScore.completenessScore * 0.4),
      breakdown: {
        riskCoverage: Math.round(llmResult.validationScore.breakdown.riskCoverage * 0.6 + ruleBasedScore.breakdown.riskCoverage * 0.4),
        competencyCoverage: Math.round(llmResult.validationScore.breakdown.competencyCoverage * 0.6 + ruleBasedScore.breakdown.competencyCoverage * 0.4),
        moduleRelevance: Math.round(llmResult.validationScore.breakdown.moduleRelevance * 0.6 + ruleBasedScore.breakdown.moduleRelevance * 0.4),
      },
    };

    // Generate review assessment
    const reviewAssessment = await generateReviewAssessment(role, trainingPlan, combinedScore);

    return {
      combinedScore,
      llmAnalysis: llmResult.llmAnalysis,
      reviewAssessment,
      fallbackUsed: llmResult.fallbackUsed,
    };
  } catch (error) {
    console.error('Comprehensive validation failed:', error);
    
    // Fall back to rule-based only
    const { calculateValidationScore } = await import('../validation');
    const fallbackScore = calculateValidationScore(role, requirements, trainingPlan, riskCategories);
    
    return {
      combinedScore: fallbackScore,
      llmAnalysis: {
        scores: {
          coverage: fallbackScore.breakdown.riskCoverage,
          relevance: fallbackScore.breakdown.moduleRelevance,
          completeness: fallbackScore.completenessScore,
          overall: fallbackScore.overallScore,
        },
        analysis: {
          strengths: ['Rule-based validation completed'],
          weaknesses: ['LLM validation unavailable'],
          gaps: [],
        },
        recommendations: ['Consider manual review for comprehensive assessment'],
        grade: fallbackScore.overallScore >= 90 ? 'A' : fallbackScore.overallScore >= 80 ? 'B' : fallbackScore.overallScore >= 70 ? 'C' : fallbackScore.overallScore >= 60 ? 'D' : 'F',
        status: fallbackScore.overallScore >= 90 ? 'excellent' : fallbackScore.overallScore >= 80 ? 'good' : fallbackScore.overallScore >= 70 ? 'adequate' : fallbackScore.overallScore >= 60 ? 'needs_improvement' : 'poor',
      },
      reviewAssessment: {
        summary: `Training plan evaluated with score ${fallbackScore.overallScore}/100`,
        strengths: ['Automated validation completed'],
        improvements: [],
        recommendations: ['Manual review recommended'],
        decision: 'needs_revision',
        justification: 'Comprehensive validation failed - using basic assessment',
      },
      fallbackUsed: true,
    };
  }
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