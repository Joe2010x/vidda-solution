// Role types
export interface Role {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  riskLevel: "low" | "medium" | "high";
  department: string;
}

// AMLR (Anti-Money Laundering Regulation) types
export interface AMLRRequirement {
  id: string;
  title: string;
  description: string;
  riskCategories: string[];
  competencyRequirements: string[];
  trainingModuleIds: string[];
  regulatoryReference: string;
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