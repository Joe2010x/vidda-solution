// Role types
export interface Role {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  riskLevel: "low" | "medium" | "high";
  department: string;
}

// Enhanced JD parsing types
export type FunctionType =
  | "customer_onboarding"
  | "transaction_monitoring"
  | "kyc_due_diligence"
  | "investigation"
  | "escalation"
  | "reporting"
  | "governance"
  | "data_handling"
  | "training_oversight"
  | "other";

export type RiskCategory =
  | "AML"
  | "KYC"
  | "sanctions"
  | "fraud"
  | "documentation"
  | "data_protection"
  | "governance";

export type SeniorityLevel = "junior" | "mid" | "senior" | "manager" | "executive" | "unknown";

export interface RiskHint {
  category: RiskCategory;
  level: "low" | "medium" | "high";
  reason: string;
}

export interface ParsedTask {
  taskId: string;
  description: string;
  evidenceText: string;
  riskHints: RiskHint[];
  functionType: FunctionType;
}

export interface AmbiguityFlag {
  field: string;
  issue: string;
  suggestedQuestion: string;
}

export interface ParsedJobDescription {
  roleName: string;
  department?: string;
  seniority?: SeniorityLevel;
  managementResponsibility: boolean | "unknown";
  roleSummary: string;
  tasks: ParsedTask[];
  overallRiskLevel: "low" | "medium" | "high";
  riskCategories: RiskCategory[];
  ambiguityFlags: AmbiguityFlag[];
  confidence: number;
  needsClarification: boolean;
  clarifyingQuestions: string[];
}

export interface JDQualityMetrics {
  confidence: number;
  needsHumanReview: boolean;
  issues: string[];
}

export interface ParsedJobDescriptionResponse {
  parsedRole: ParsedJobDescription;
  quality: JDQualityMetrics;
  nextRecommendedAction: "map_role_to_risks" | "request_clarification";
}

// AMLR (Anti-Money Laundering Regulation) types
export interface AMLRRequirement {
  id: string;
  title: string;
  description: string;
  riskCategories: string[];
  competencyRequirements: string[];
  trainingModuleIds: string[];
}

// Training module types
export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: "video" | "interactive" | "assessment" | "document";
  priority: "low" | "medium" | "high";
  competencyAreas: string[];
}

// Training plan types
export interface TrainingPlanItem {
  module: TrainingModule;
  requirement: AMLRRequirement;
  priority: number; // 1-10
  estimatedDuration: number;
}

export interface TrainingPlan {
  roleId: string;
  roleName: string;
  items: TrainingPlanItem[];
  totalDuration: number;
  generatedAt: string;
}

// Validation score types
export interface ValidationScore {
  overallScore: number; // 0-100
  coverageScore: number; // How well requirements are covered
  relevanceScore: number; // How relevant modules are to role
  completenessScore: number; // Are all risk areas addressed
  breakdown: {
    riskCoverage: number;
    competencyCoverage: number;
    moduleRelevance: number;
  };
}

// Human review types
export interface ReviewComment {
  id: string;
  reviewerId: string;
  reviewerName: string;
  comment: string;
  rating: "approve" | "needs_revision" | "reject";
  createdAt: string;
}

export interface ReviewStatus {
  status: "pending" | "approved" | "needs_revision" | "rejected";
  comments: ReviewComment[];
  lastUpdated: string;
}

// LMS Assignment types
export interface LMSAssignment {
  id: string;
  trainingPlanId: string;
  roleId: string;
  roleName: string;
  assignedTo: string[]; // User IDs
  assignedBy: string;
  dueDate: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  completionRate: number;
  createdAt: string;
}

// Pipeline state types
export interface PipelineState {
  selectedRole: Role | null;
  extractedTasks: string[];
  mappedRisks: string[];
  retrievedRequirements: AMLRRequirement[];
  competencyNeeds: string[];
  trainingPlan: TrainingPlan | null;
  validationScore: ValidationScore | null;
  reviewStatus: ReviewStatus | null;
  lmsAssignment: LMSAssignment | null;
}