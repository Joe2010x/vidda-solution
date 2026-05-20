/**
 * Enhanced Training Plan types for Risk-aware, Competency-driven training generation
 * Aligned with AMLR 2024/1624 requirements
 */

// Competency types as per AMLR Article 13
export type CompetencyType = 'knowledge' | 'skills' | 'judgement';

// Activity competency categories for learning progression
export type ActivityCompetencyCategory = 'knowledge' | 'skills' | 'judgement' | 'assessment';

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
 * Learning Activity - a granular training component within a module
 * Each activity is assigned to a specific quarter based on its competency category
 */
export interface LearningActivity {
  id: string;
  title: string;
  description: string;
  
  // Parent module reference
  parentModuleId: string;
  parentModuleTitle: string;
  
  // Quarter assignment
  assignedQuarter: TrainingQuarter;
  
  // Competency category this activity focuses on
  competencyCategory: ActivityCompetencyCategory;
  
  // Duration in minutes
  durationMinutes: number;
  
  // Linked competencies (the actual competency text)
  linkedCompetencies: string[];
  
  // Traceability
  linkedTaskIds: string[];
  riskCategories: string[];
  primaryRequirement: string;
  
  // Explainability
  whyIncluded: string;
  
  // Review
  humanReviewRequired: boolean;
}

/**
 * Training module for rule-based generation (simplified)
 */
export interface TrainingModuleItem {
  moduleId: string;
  title: string;
  description: string;
  
  // Traceability
  linkedTaskIds: string[];
  linkedCompetencyIds: string[];
  linkedRisks: string[];         // e.g. ["suspicious-activity", "reporting", "tipping-off"]
  primaryRequirement: string;
  regulatoryBasis: string[];
  
  // Competency coverage
  competencyCategoriesCovered: CompetencyType[];

  // Full competency text grouped by category (K / S / J)
  linkedCompetenciesByCategory: {
    knowledge: string[];
    skills: string[];
    judgement: string[];
  };
  
  // Learning design
  learningObjectives: string[];
  assessmentMethod: AssessmentMethod;
  
  // Logistics
  durationMinutes: number;
  quarter: TrainingQuarter;
  priority: 'low' | 'medium' | 'high';
  priorityScore: number; // 1-10 scale
  
  // Explainability
  whyIncluded: string;
  
  // Review
  humanReviewRequired: boolean;
  reviewReason?: string;
  
  // Activities breakdown - granular learning components across quarters
  activities: LearningActivity[];
}

/**
 * Quarterly training plan section
 */
export interface QuarterlySection {
  quarter: TrainingQuarter;
  title: string;
  description: string;
  modules: TrainingModuleItem[];
  // All activities assigned to this quarter (from all modules)
  activities: LearningActivity[];
}

/**
 * Enhanced training plan with quarterly organization
 */
export interface EnhancedTrainingPlan {
  roleId: string;
  roleName: string;
  generatedAt: string;
  
  // Quarterly organization
  quarters: QuarterlySection[];
  
  // Summary statistics
  totalModules: number;
  totalDurationMinutes: number;
  
  // Traceability
  linkedTaskIds: string[];
  linkedRequirementIds: string[];
  linkedCompetencyIds: string[];
  
  // Quality metrics
  qualityScore: {
    riskCoverage: number;
    competencyCoverage: number;
    regulatoryTraceability: number;
    overallScore: number;
  };
  
  // Review status
  humanReviewRequired: boolean;
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
 * Quarterly training plan structure (legacy)
 */
export interface QuarterlyTrainingPlan {
  Q1: EnhancedTrainingModule[]; // Foundation
  Q2: EnhancedTrainingModule[]; // Application
  Q3: EnhancedTrainingModule[]; // Deepening
  Q4: EnhancedTrainingModule[]; // Embedding
}