/**
 * Audit trail types for traceability across the pipeline
 * Ensures every step has clear input/output linkage for compliance
 */

// Pipeline stages for audit tracking
export type PipelineStage = 
  | 'jd_input'
  | 'jd_parsing'
  | 'jd_review'
  | 'risk_mapping'
  | 'risk_review'
  | 'training_generation'
  | 'validation'
  | 'final_review';

/**
 * Audit entry for a single pipeline step
 */
export interface AuditEntry {
  id: string;
  stage: PipelineStage;
  timestamp: string;
  action: 'created' | 'modified' | 'approved' | 'rejected' | 'reviewed';
  
  // Input reference - what data this step received
  inputReference: {
    sourceStage: PipelineStage;
    sourceEntryId: string;
    dataHash: string; // Hash of input data for integrity verification
  };
  
  // Output reference - what data this step produced
  outputReference: {
    dataHash: string;
    data: Record<string, unknown>;
  };
  
  // Human review info (if applicable)
  humanReview?: {
    reviewerId: string;
    reviewerName: string;
    status: 'approved' | 'rejected' | 'needs_changes';
    comment: string;
    changes: AuditChange[];
    timestamp: string;
  };
  
  // AI processing info (if applicable)
  aiProcessing?: {
    model: string;
    confidence: number;
    reasoning: string;
    warnings: string[];
  };
}

/**
 * Individual change record in an audit trail
 */
export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  changedBy: string;
  timestamp: string;
}

/**
 * Traceability link between pipeline stages
 */
export interface TraceabilityLink {
  fromStage: PipelineStage;
  fromId: string;
  toStage: PipelineStage;
  toId: string;
  linkageType: 'derived_from' | 'modified_from' | 'validated_against';
  confidence: number;
}

/**
 * Complete audit trail for a training plan generation
 */
export interface AuditTrail {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'failed';
  
  // Chain of audit entries
  entries: AuditEntry[];
  
  // Traceability links between stages
  traceabilityLinks: TraceabilityLink[];
  
  // Summary of human reviews
  humanReviewSummary: {
    totalReviews: number;
    approvals: number;
    rejections: number;
    changesRequested: number;
  };
  
  // Data integrity verification
  integrityCheck: {
    allHashesValid: boolean;
    brokenLinks: string[];
    missingStages: PipelineStage[];
  };
}

/**
 * Risk mapping audit data - links tasks to mapped risks
 */
export interface RiskMappingAuditData {
  // Source task from JD review
  sourceTask: {
    taskId: string;
    description: string;
    evidenceText: string;
    approvedRiskHints: Array<{
      category: string;
      level: string;
      reason: string;
    }>;
  };
  
  // AI mapped risks
  mappedRisks: {
    category: string;
    level: 'low' | 'medium' | 'high';
    reasoning: string;
    confidence: number;
  }[];
  
  // Traceability
  traceability: {
    fromJdReviewId: string;
    fromTaskId: string;
    mappingMethod: 'ai' | 'rule_based' | 'manual';
  };
}
