/**
 * Audit Trail Builder - Creates compliance audit trails for training plan generation
 * Ensures full traceability from job description to final training plan
 */

import type { 
  AuditTrail, 
  AuditEntry, 
  TraceabilityLink, 
  PipelineStage,
  AuditChange 
} from '@/types/audit';

/**
 * Builder class for constructing audit trails during pipeline execution
 */
export class AuditTrailBuilder {
  private sessionId: string;
  private startedAt: string;
  private entries: AuditEntry[] = [];
  private traceabilityLinks: TraceabilityLink[] = [];
  private humanReviewCount = 0;
  private approvals = 0;
  private rejections = 0;
  private changesRequested = 0;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
    this.startedAt = new Date().toISOString();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate a unique entry ID
   */
  private generateEntryId(): string {
    return `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * Create a simple hash of data for integrity verification
   */
  private createDataHash(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Add an audit entry for a pipeline stage
   */
  addEntry(
    stage: PipelineStage,
    action: AuditEntry['action'],
    inputData: unknown,
    outputData: unknown,
    options?: {
      aiProcessing?: {
        model: string;
        confidence: number;
        reasoning: string;
        warnings?: string[];
      };
      humanReview?: {
        reviewerId: string;
        reviewerName: string;
        status: 'approved' | 'rejected' | 'needs_changes';
        comment: string;
        changes: AuditChange[];
      };
    }
  ): string {
    const entryId = this.generateEntryId();
    const timestamp = new Date().toISOString();

    // Find previous entry for input reference
    const previousEntry = this.entries.length > 0 
      ? this.entries[this.entries.length - 1] 
      : null;

    const entry: AuditEntry = {
      id: entryId,
      stage,
      timestamp,
      action,
      inputReference: {
        sourceStage: previousEntry?.stage || stage,
        sourceEntryId: previousEntry?.id || 'initial',
        dataHash: this.createDataHash(inputData),
      },
      outputReference: {
        dataHash: this.createDataHash(outputData),
        data: outputData as Record<string, unknown>,
      },
      ...(options?.humanReview && {
        humanReview: {
          ...options.humanReview,
          timestamp,
        },
      }),
      ...(options?.aiProcessing && {
        aiProcessing: {
          ...options.aiProcessing,
          warnings: options.aiProcessing.warnings || [],
        },
      }),
    };

    this.entries.push(entry);

    // Update human review summary
    if (options?.humanReview) {
      this.humanReviewCount++;
      if (options.humanReview.status === 'approved') this.approvals++;
      if (options.humanReview.status === 'rejected') this.rejections++;
      if (options.humanReview.status === 'needs_changes') this.changesRequested++;
    }

    return entryId;
  }

  /**
   * Add a traceability link between pipeline stages
   */
  addTraceabilityLink(
    fromStage: PipelineStage,
    fromId: string,
    toStage: PipelineStage,
    toId: string,
    linkageType: TraceabilityLink['linkageType'],
    confidence: number
  ): void {
    this.traceabilityLinks.push({
      fromStage,
      fromId,
      toStage,
      toId,
      linkageType,
      confidence,
    });
  }

  /**
   * Build and return the complete audit trail
   */
  build(): AuditTrail {
    // Check for missing stages
    const allStages: PipelineStage[] = [
      'jd_input', 'jd_parsing', 'jd_review', 'risk_mapping', 
      'risk_review', 'training_generation', 'validation', 'final_review'
    ];
    
    const presentStages = new Set(this.entries.map(e => e.stage));
    const missingStages = allStages.filter(s => !presentStages.has(s)) as PipelineStage[];

    // Verify data integrity (check for broken links)
    const brokenLinks: string[] = [];
    for (let i = 1; i < this.entries.length; i++) {
      const current = this.entries[i];
      const previous = this.entries[i - 1];
      
      if (current.inputReference.sourceEntryId !== previous.id) {
        brokenLinks.push(`Entry ${current.id} references missing entry ${current.inputReference.sourceEntryId}`);
      }
    }

    return {
      sessionId: this.sessionId,
      startedAt: this.startedAt,
      completedAt: new Date().toISOString(),
      status: 'completed',
      entries: this.entries,
      traceabilityLinks: this.traceabilityLinks,
      humanReviewSummary: {
        totalReviews: this.humanReviewCount,
        approvals: this.approvals,
        rejections: this.rejections,
        changesRequested: this.changesRequested,
      },
      integrityCheck: {
        allHashesValid: brokenLinks.length === 0,
        brokenLinks,
        missingStages,
      },
    };
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get entries count
   */
  getEntriesCount(): number {
    return this.entries.length;
  }
}

/**
 * Create a new audit trail builder instance
 */
export function createAuditTrailBuilder(sessionId?: string): AuditTrailBuilder {
  return new AuditTrailBuilder(sessionId);
}