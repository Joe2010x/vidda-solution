/**
 * Enhanced Training Plan types for Risk-aware, Competency-driven training generation
 * Aligned with AMLR 2024/1624 requirements
 */

// Competency types as per AMLR Article 13
export type CompetencyType = 'knowledge' | 'skill' | 'judgement';

// Training module types based on learning progression
export type ModuleType = 'foundation' | 'application' | 'deepening' | 'embedding';

// Quarterly periods for training plan organization
export type TrainingQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

// Assessment methods for competency evaluation
export type AssessmentMethod = 'quiz' | 'scenario' | 'case_review' | 'manager_observation' | 'qa_review';

// Human review status for generated content
export type HumanReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes';

/**
 * Regulatory basis reference linking training to AMLR requirements
 */
export interface RegulatoryBasis {
  article: string; // e.g., "AMLR Article 12"
  chunkId?: string; // Reference to RAG corpus chunk
  summary: string; // Plain language summary of the requirement
  sourceExcerpt?: string; // Direct quote from regulation
}

/**
 * Competency need identified from role analysis
 */
export interface CompetencyNeed {
  id: string;
  linkedTask: string; // The specific task that drives this need
  linkedRisk: string; // The risk this competency addresses
  riskCategory: string; // e.g., "KYC", "AML", "Sanctions"
  riskLevel: 'low' | 'medium' | 'high';
  regulatoryBasis: RegulatoryBasis;
  competencyTypes: CompetencyType[];
  knowledge: string[]; // Knowledge areas to develop
  skills: string[]; // Practical skills to build
  judgement: string[]; // Decision-making capabilities
  humanReviewRequired: boolean;
}

/**
 * Enhanced training module with full traceability
 */
export interface EnhancedTrainingModule {
  id: string;
  title: string;
  description: string;
  
  // Source and type
  source: 'catalog' | 'generated';
  moduleType: ModuleType;
  
  // Traceability links
  linkedRole: string;
  linkedTasks: string[];
  linkedRisks: string[];
  linkedCompetencies: string[];
  
  // Regulatory grounding
  regulatoryBasis: RegulatoryBasis[];
  
  // Learning design
  learningObjectives: string[];
  assessmentMethod: AssessmentMethod;
  
  // Logistics
  durationMinutes: number;
  priority: 'low' | 'medium' | 'high';
  priorityScore: number; // 1-10 scale
  
  // Explainability
  whyIncluded: string; // Clear explanation of why this module is assigned
  
  // Review status
  humanReviewStatus: HumanReviewStatus;
  
  // Quarterly assignment
  assignedQuarter: TrainingQuarter;
}

/**
 * Competency coverage summary
 */
export interface CompetencyCoverage {
  knowledgeCoverage: number; // 0-100%
  skillCoverage: number; // 0-100%
  judgementCoverage: number; // 0-100%
  uncoveredCompetencies: string[];
}

/**
 * Risk coverage summary
 */
export interface RiskCoverage {
  highRiskTaskCoverage: number; // % of high-risk tasks with training
  mediumRiskTaskCoverage: number;
  lowRiskTaskCoverage: number;
  uncoveredRisks: string[];
}

/**
 * Quality score breakdown
 */
export interface QualityCheck {
  name: string;
  passed: boolean;
  score: number;
  message: string;
}

/**
 * Training plan quality metrics
 */
export interface TrainingPlanQuality {
  overallScore: number; // 0-100
  checks: QualityCheck[];
  riskCoverage: RiskCoverage;
  competencyCoverage: CompetencyCoverage;
  regulatoryTraceability: number; // % of modules with regulatory basis
}

/**
 * Quarterly training plan structure
 */
export interface QuarterlyTrainingPlan {
  Q1: EnhancedTrainingModule[]; // Foundation
  Q2: EnhancedTrainingModule[]; // Application
  Q3: EnhancedTrainingModule[]; // Deepening
  Q4: EnhancedTrainingModule[]; // Embedding
}

/**
 * Enhanced training plan with full traceability
 */
export interface EnhancedTrainingPlan {
  roleId: string;
  roleName: string;
  generatedAt: string;
  
  // Quarterly organization
  quarterlyPlan: QuarterlyTrainingPlan;
  
  // Summary statistics
  totalModules: number;
  totalDurationMinutes: number;
  
  // Traceability
  linkedTasks: string[];
  linkedRisks: string[];
  competencyNeedsAddressed: string[];
  
  // Quality metrics
  quality: TrainingPlanQuality;
  
  // Review status
  humanReviewStatus: HumanReviewStatus;
}