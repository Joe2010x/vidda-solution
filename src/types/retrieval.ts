/**
 * Enhanced retrieval types for task-level risk mapping and requirement traceability
 * Implements the "Role Task → Risk → AMLR Requirement → Competency Need" chain
 */

import type { AMLRRequirement, RiskCategory, RiskHint } from "./index";

/**
 * Task-level risk mapping with full traceability
 */
export interface RiskMapping {
  taskId: string;
  taskDescription: string;
  evidenceText: string;
  
  riskCategory: RiskCategory | string;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  
  // Link to matched AMLR requirements
  matchedRequirements: MatchedRequirement[];
}

/**
 * A matched AMLR requirement with confidence and reasoning
 */
export interface MatchedRequirement {
  requirementId: string;
  requirementTitle: string;
  article: string;
  reason: string;
  confidence: number; // 0-1
}

/**
 * Task-level requirement mapping with competency needs
 */
export interface TaskRequirementMapping {
  taskId: string;
  taskDescription: string;
  riskCategory: string;
  riskLevel: 'low' | 'medium' | 'high';
  
  // Matched requirements with full details
  requirements: MatchedRequirementDetail[];
  
  // Suggested competency needs based on requirements
  suggestedCompetencyNeeds: CompetencyNeedSummary;
}

/**
 * Matched requirement with full traceability
 */
export interface MatchedRequirementDetail {
  id: string;
  title: string;
  article: string;
  sourceExcerpt: string;
  relevanceReason: string;
  confidence: number;
}

/**
 * Competency need summary by type
 */
export interface CompetencyNeedSummary {
  knowledge: string[];
  skills: string[];
  judgement: string[];
}

/**
 * Enhanced retrieval result with task-level traceability
 */
export interface EnhancedRetrievalResult {
  roleId: string;
  roleName: string;
  
  // Task-level requirement mappings
  taskRequirementMappings: TaskRequirementMapping[];
  
  // Summary statistics
  summary: RetrievalSummary;
  
  // Validation results
  validation: RetrievalValidation;
}

/**
 * Summary of retrieval results
 */
export interface RetrievalSummary {
  totalTasks: number;
  highRiskTasks: number;
  mediumRiskTasks: number;
  lowRiskTasks: number;
  
  uniqueRiskCategories: string[];
  matchedRequirementCount: number;
  avgConfidence: number;
}

/**
 * Validation of retrieval coverage
 */
export interface RetrievalValidation {
  allHighRisksCovered: boolean;
  uncoveredRisks: string[];
  lowConfidenceMappings: string[];
  needsHumanReview: boolean;
  reviewReasons: string[];
}

/**
 * Coverage check result
 */
export interface CoverageCheck {
  highRiskCoverage: number; // 0-100%
  mediumRiskCoverage: number;
  lowRiskCoverage: number;
  
  uncoveredHighRiskTasks: string[];
  uncoveredRiskCategories: string[];
  
  recommendations: string[];
}