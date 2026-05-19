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
  riskCategories: string[]; // Multiple risk tags
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
 * Business Requirement (业务需求)
 * e.g., CDD, EDD, SAR, Risk Assessment, Internal Controls
 */
export interface BusinessRequirement {
  id: string;
  title: string; // e.g., "Enhanced Due Diligence"
}

/**
 * Regulatory Basis (法规依据)
 * e.g., AMLR Article 9, 12, 13
 */
export interface RegulatoryBasis {
  article: string; // e.g., "AMLR Article 9"
  articleTitle: string; // e.g., "Internal policies, procedures and controls"
  sourceExcerpt: string;
  sourceChunkId?: string;
}

/**
 * Mapping role type - how the requirement relates to the task
 */
export type RequirementMappingRole = 
  | "primary"           // Direct regulatory requirement for the task
  | "supporting"        // Supporting regulatory basis
  | "training_obligation"    // Training requirement (Article 12)
  | "competency_obligation"; // Competency assessment requirement (Article 13)

/**
 * Task-level requirement mapping with competency needs
 */
export interface TaskRequirementMapping {
  taskId: string;
  /** The task description - must match the original input exactly */
  taskDescription: string;
  /** Original task description from the source - for audit trail verification */
  originalTaskDescription: string;
  /** Optional short label for UI display (does not affect traceability) */
  displayLabel?: string;
  riskCategory: string;
  riskCategories: string[]; // Multiple risk tags
  riskLevel: 'low' | 'medium' | 'high';
  
  // Matched requirements with full details
  requirements: RequirementMapping[];
  
  // Suggested competency needs based on requirements
  suggestedCompetencyNeeds: CompetencyNeedSummary;
}

/**
 * Requirement Mapping (完整的需求映射)
 * Separates business requirement from regulatory basis
 */
export interface RequirementMapping {
  // Business Requirement (业务需求)
  businessRequirement: BusinessRequirement;
  
  // Regulatory Basis (法规依据)
  regulatoryBasis: RegulatoryBasis;
  
  // How this requirement relates to the task
  mappingRole: RequirementMappingRole;
  
  // Confidence and reasoning
  confidence: number;
  relevanceReason: string;
}

/**
 * Matched requirement with full traceability (legacy interface for backward compatibility)
 * @deprecated Use RequirementMapping instead
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
 * Confidence status for normalized competencies
 */
export type ConfidenceStatus = 'verified' | 'tentative' | 'assumed';

/**
 * Priority level for normalized competencies
 */
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Normalized and enriched competency item with full traceability
 * Used by Competency Normalizer to create structured competency objects
 */
export interface NormalizedCompetency {
  /** Unique identifier: e.g., "comp-task-2-sar-001" */
  competencyId: string;
  
  /** Source task ID - must match the original extraction */
  taskId: string;
  
  /** Source task description - preserved from original extraction */
  taskDescription: string;
  
  /** Competency category */
  category: 'knowledge' | 'skills' | 'judgement';
  
  /** The competency text/description */
  text: string;
  
  /** Primary linked business requirement title */
  primaryRequirement: string;
  
  /** Supporting/secondary requirement titles */
  supportingRequirements: string[];
  
  /** Linked regulatory articles */
  linkedRegulatoryBasis: string[];
  
  /** Risk level inherited from task */
  riskLevel: 'low' | 'medium' | 'high';
  
  /** Priority level for training planning */
  priority: PriorityLevel;
  
  /** Confidence status */
  confidenceStatus: ConfidenceStatus;
  
  /** Whether human review is required */
  humanReviewRequired: boolean;
  
  /** Index in the source mapping array */
  sourceMappingIndex: number;
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

/**
 * Competency Cluster - groups related competencies for training module generation
 * Clusters competencies by task + requirement + category to avoid generating too many modules
 */
export interface CompetencyCluster {
  /** Unique identifier: e.g., "sar-reporting" */
  groupId: string;
  
  /** Display title for the cluster */
  title: string;
  
  /** Source task IDs that contribute to this cluster */
  linkedTaskIds: string[];
  
  /** Primary linked business requirement */
  primaryRequirement: string;
  
  /** Supporting requirements */
  supportingRequirements: string[];
  
  /** Risk level (highest from contributing tasks) */
  riskLevel: 'low' | 'medium' | 'high';
  
  /** Priority level */
  priority: PriorityLevel;
  
  /** Grouped competencies by category */
  competencies: {
    knowledge: string[];
    skills: string[];
    judgement: string[];
  };
  
  /** Linked regulatory articles */
  linkedRegulatoryBasis: string[];
  
  /** Whether human review is required */
  humanReviewRequired: boolean;
}
