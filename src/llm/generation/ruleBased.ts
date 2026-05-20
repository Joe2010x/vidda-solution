import {
  Role,
  AMLRRequirement,
  TrainingPlan,
  TrainingPlanItem,
} from '@/types';
import { trainingModules } from '@/data/amlrRequirements';
import type { 
  NormalizedCompetency, 
  CompetencyCluster,
  PriorityLevel 
} from '@/types/retrieval';
import type {
  EnhancedTrainingPlan,
  TrainingModuleItem,
  QuarterlySection,
  TrainingQuarter,
  LearningActivity,
  ActivityCompetencyCategory,
} from '@/types/training';
import { clusterCompetencies } from '@/llm/retrieval/competencyClusterer';

/**
 * Map competency category to training quarter
 * - knowledge -> Q1 (Foundation)
 * - skills -> Q2 (Application)
 * - judgement -> Q3 (Deepening)
 * - assessment -> Q4 (Embedding)
 */
export function categoryToQuarter(category: 'knowledge' | 'skills' | 'judgement'): TrainingQuarter {
  switch (category) {
    case 'knowledge': return 'Q1';
    case 'skills': return 'Q2';
    case 'judgement': return 'Q3';
    default: return 'Q1';
  }
}

/**
 * Map priority level to numeric score
 */
export function priorityToScore(priority: PriorityLevel): number {
  switch (priority) {
    case 'critical': return 9;
    case 'high': return 7;
    case 'medium': return 5;
    case 'low': return 3;
    default: return 5;
  }
}

/**
 * Map risk level to numeric multiplier
 */
export function riskToMultiplier(riskLevel: 'low' | 'medium' | 'high'): number {
  switch (riskLevel) {
    case 'high': return 1.5;
    case 'medium': return 1.2;
    case 'low': return 1.0;
    default: return 1.0;
  }
}

/**
 * Calculate priority score (1-10 scale) from priority level and risk
 */
export function calculatePriorityScore(
  priority: PriorityLevel,
  riskLevel: 'low' | 'medium' | 'high'
): number {
  const baseScore = priorityToScore(priority);
  const multiplier = riskToMultiplier(riskLevel);
  return Math.min(10, Math.round(baseScore * multiplier));
}

/**
 * Map priority score to priority label
 */
export function scoreToPriorityLabel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/**
 * Maps primary requirement titles to relevant AML/CTF risk category tags
 */
const REQUIREMENT_TO_RISKS: Record<string, string[]> = {
  'Suspicious Activity Reporting': ['suspicious-activity', 'reporting', 'tipping-off', 'ongoing-monitoring'],
  'Enhanced Due Diligence': ['pep', 'high-risk-country', 'source-of-wealth', 'edd'],
  'Customer Due Diligence': ['kyc', 'customer-risk', 'beneficial-ownership'],
  'Internal Controls and Governance': ['internal-controls', 'governance', 'policies'],
  'Risk Assessment': ['risk-assessment', 'ongoing-monitoring'],
  'Record Keeping': ['record-keeping', 'documentation'],
  'Training and Awareness': ['training', 'awareness'],
  'Sanctions Compliance': ['sanctions', 'asset-freezing'],
  'PEP Management': ['pep', 'high-risk-country'],
  'Beneficial Ownership': ['beneficial-ownership', 'kyc'],
};

/**
 * Brief role-task description per requirement type (used in whyIncluded)
 */
const REQUIREMENT_ROLE_DESCRIPTION: Record<string, string> = {
  'Suspicious Activity Reporting': 'monitors transactions and prepares Suspicious Activity Reports (SARs)',
  'Enhanced Due Diligence': 'conducts enhanced due diligence on high-risk customers and PEPs',
  'Customer Due Diligence': 'performs customer due diligence and onboarding risk assessment',
  'Internal Controls and Governance': 'supports AML governance, internal controls, and compliance oversight',
  'Risk Assessment': 'conducts risk assessments and ongoing transaction monitoring',
  'Record Keeping': 'maintains audit trails and regulatory documentation',
  'Training and Awareness': 'delivers or participates in AML training and competency development',
  'Sanctions Compliance': 'conducts sanctions screening and manages asset-freezing obligations',
  'PEP Management': 'identifies, screens, and manages politically exposed persons',
  'Beneficial Ownership': 'verifies beneficial ownership and ultimate beneficiary identity',
};

/**
 * Generate a specific risk-chain whyIncluded explanation:
 * role task → risk → requirement → competency → module
 */
export function generateWhyIncluded(
  cluster: CompetencyCluster,
  roleName: string
): string {
  const roleDescription =
    REQUIREMENT_ROLE_DESCRIPTION[cluster.primaryRequirement] ??
    `performs tasks related to ${cluster.primaryRequirement}`;

  const riskText =
    cluster.riskLevel === 'high' ? 'high'
    : cluster.riskLevel === 'medium' ? 'elevated'
    : 'standard';

  const competencyCount =
    cluster.competencies.knowledge.length +
    cluster.competencies.skills.length +
    cluster.competencies.judgement.length;

  // Pick the most illustrative competencies for the explanation
  const keyCompetencies = [
    ...cluster.competencies.judgement.slice(0, 2),
    ...cluster.competencies.skills.slice(0, 1),
  ].filter(Boolean);

  let explanation = `Included because this role ${roleDescription}.` +
    ` These tasks create ${riskText} AML/CTF risk, requiring ${competencyCount} competencies.`;

  if (keyCompetencies.length > 0) {
    explanation += ` Key areas: ${keyCompetencies.join('; ')}.`;
  }

  if (cluster.linkedRegulatoryBasis.length > 0) {
    explanation += ` Required by ${cluster.linkedRegulatoryBasis.slice(0, 2).join(' and ')}.`;
  }

  return explanation;
}

/**
 * Generate a human-readable review reason for modules that require review
 */
export function generateReviewReason(cluster: CompetencyCluster): string {
  const reasons: string[] = [];

  if (cluster.priority === 'critical') {
    reasons.push('includes critical decision-making competencies requiring senior compliance sign-off');
  }
  if (cluster.riskLevel === 'high') {
    reasons.push('covers high-risk regulatory obligations with significant legal and reputational impact');
  }
  if (cluster.competencies.judgement.length > 2) {
    reasons.push('professional judgement competencies must be validated by a compliance manager before delivery');
  }
  if (cluster.linkedRegulatoryBasis.some(b => b.toLowerCase().includes('article 12') || b.toLowerCase().includes('article 13'))) {
    reasons.push('directly linked to AMLR Articles 12/13 mandatory training and competency assessment obligations');
  }

  const base = reasons.length > 0
    ? `Human review required: this module ${reasons.join('; ')}.`
    : 'Human review recommended before finalising this module.';

  return base;
}

/**
 * Determine the primary quarter for a cluster based on its competency mix.
 * Q4 is returned when the cluster has Q4-type competencies (coaching/QA/assessment)
 * that outnumber the other categories.
 */
export function determinePrimaryQuarter(cluster: CompetencyCluster): TrainingQuarter {
  const knowledgeCount = cluster.competencies.knowledge.length;
  const skillsCount = cluster.competencies.skills.length;
  const judgementCount = cluster.competencies.judgement.length;

  // Count Q4-type competencies (coaching, QA, assessment, review keywords)
  const allCompetencies = [
    ...cluster.competencies.knowledge,
    ...cluster.competencies.skills,
    ...cluster.competencies.judgement,
  ];
  const q4Count = allCompetencies.filter(c => isQ4Competency(c)).length;
  const nonQ4Total = allCompetencies.length - q4Count;

  // If more than half are Q4-type, assign the module to Q4
  if (q4Count > nonQ4Total) {
    return 'Q4';
  }

  // Determine dominant category among non-Q4 competencies
  if (judgementCount > knowledgeCount && judgementCount > skillsCount) {
    return 'Q3';
  }
  if (skillsCount > knowledgeCount) {
    return 'Q2';
  }
  return 'Q1';
}

/**
 * Generate activity title based on category and cluster
 */
function generateActivityTitle(
  cluster: CompetencyCluster,
  category: ActivityCompetencyCategory
): string {
  const titleTemplates: Record<ActivityCompetencyCategory, string> = {
    knowledge: `${cluster.title}: Knowledge Foundation`,
    skills: `${cluster.title}: Practical Skills Workshop`,
    judgement: `${cluster.title}: Decision-Making Scenario Lab`,
    assessment: `${cluster.title}: Competency Assessment`,
  };
  return titleTemplates[category] || cluster.title;
}

/**
 * Generate activity description based on category
 */
function generateActivityDescription(
  cluster: CompetencyCluster,
  category: ActivityCompetencyCategory
): string {
  const descTemplates: Record<ActivityCompetencyCategory, string> = {
    knowledge: `Learn the fundamental knowledge areas for ${cluster.title}`,
    skills: `Practice applying practical skills for ${cluster.title} through hands-on exercises`,
    judgement: `Develop professional judgement through scenario-based learning for ${cluster.title}`,
    assessment: `Assessment and validation of competencies for ${cluster.title}`,
  };
  return descTemplates[category] || `Learning activity for ${cluster.title}`;
}

/**
 * Check if a competency text indicates Q4 (Embedding/Assessment) activities
 * Q4 activities include: coaching, QA review, audit, assessment, feedback, sign-off
 */
function isQ4Competency(text: string): boolean {
  const lowerText = text.toLowerCase();
  return (
    lowerText.includes('coach') ||
    lowerText.includes('review') ||
    lowerText.includes('feedback') ||
    lowerText.includes('assessment') ||
    lowerText.includes('audit') ||
    lowerText.includes('qa') ||
    lowerText.includes('sign-off') ||
    lowerText.includes('signoff') ||
    lowerText.includes('junior') ||
    lowerText.includes('mentoring') ||
    lowerText.includes('mentor') ||
    lowerText.includes('quality assurance') ||
    lowerText.includes('observe') ||
    lowerText.includes('observation') ||
    lowerText.includes('refresher') ||
    lowerText.includes('embed') ||
    lowerText.includes('embedding')
  );
}

/**
 * Split a competency cluster into learning activities across quarters
 * This ensures each module has activities distributed across Q1-Q4 based on competency types
 * 
 * Quarter assignment rules:
 * - Q4 keywords (coach, review, feedback, assessment, audit, qa, etc.) → Q4 Embedding
 * - judgement competencies → Q3 Deepening
 * - skills competencies → Q2 Application
 * - knowledge competencies → Q1 Foundation
 */
export function splitClusterToActivities(
  cluster: CompetencyCluster,
  roleName: string,
  moduleIndex: number
): LearningActivity[] {
  const activities: LearningActivity[] = [];
  const moduleId = `module-${cluster.groupId}-${moduleIndex}`;
  const linkedRisks = REQUIREMENT_TO_RISKS[cluster.primaryRequirement] ?? [cluster.riskLevel + '-risk'];
  
  // Separate Q4 competencies from each category
  const q4Knowledge = cluster.competencies.knowledge.filter(c => isQ4Competency(c));
  const q4Skills = cluster.competencies.skills.filter(c => isQ4Competency(c));
  const q4Judgement = cluster.competencies.judgement.filter(c => isQ4Competency(c));
  
  // Non-Q4 competencies for Q1-Q3
  const nonQ4Knowledge = cluster.competencies.knowledge.filter(c => !isQ4Competency(c));
  const nonQ4Skills = cluster.competencies.skills.filter(c => !isQ4Competency(c));
  const nonQ4Judgement = cluster.competencies.judgement.filter(c => !isQ4Competency(c));
  
  // Q1: Knowledge activities (non-Q4)
  if (nonQ4Knowledge.length > 0) {
    activities.push({
      id: `${moduleId}-q1-knowledge`,
      title: generateActivityTitle(cluster, 'knowledge'),
      description: generateActivityDescription(cluster, 'knowledge'),
      parentModuleId: moduleId,
      parentModuleTitle: cluster.title,
      assignedQuarter: 'Q1',
      competencyCategory: 'knowledge',
      durationMinutes: Math.max(20, nonQ4Knowledge.length * 10),
      linkedCompetencies: nonQ4Knowledge,
      linkedTaskIds: cluster.linkedTaskIds,
      riskCategories: linkedRisks,
      primaryRequirement: cluster.primaryRequirement,
      whyIncluded: `Knowledge foundation: ${generateWhyIncluded(cluster, roleName)}`,
      humanReviewRequired: false,
    });
  }
  
  // Q2: Skills activities (non-Q4)
  if (nonQ4Skills.length > 0) {
    activities.push({
      id: `${moduleId}-q2-skills`,
      title: generateActivityTitle(cluster, 'skills'),
      description: generateActivityDescription(cluster, 'skills'),
      parentModuleId: moduleId,
      parentModuleTitle: cluster.title,
      assignedQuarter: 'Q2',
      competencyCategory: 'skills',
      durationMinutes: Math.max(25, nonQ4Skills.length * 12),
      linkedCompetencies: nonQ4Skills,
      linkedTaskIds: cluster.linkedTaskIds,
      riskCategories: linkedRisks,
      primaryRequirement: cluster.primaryRequirement,
      whyIncluded: `Skills development: ${generateWhyIncluded(cluster, roleName)}`,
      humanReviewRequired: false,
    });
  }
  
  // Q3: Judgement activities (non-Q4)
  if (nonQ4Judgement.length > 0) {
    activities.push({
      id: `${moduleId}-q3-judgement`,
      title: generateActivityTitle(cluster, 'judgement'),
      description: generateActivityDescription(cluster, 'judgement'),
      parentModuleId: moduleId,
      parentModuleTitle: cluster.title,
      assignedQuarter: 'Q3',
      competencyCategory: 'judgement',
      durationMinutes: Math.max(30, nonQ4Judgement.length * 15),
      linkedCompetencies: nonQ4Judgement,
      linkedTaskIds: cluster.linkedTaskIds,
      riskCategories: linkedRisks,
      primaryRequirement: cluster.primaryRequirement,
      whyIncluded: `Judgement development: ${generateWhyIncluded(cluster, roleName)}`,
      humanReviewRequired: cluster.humanReviewRequired,
    });
  }
  
  // Q4: Assessment/Embedding activities (all Q4 competencies)
  const allQ4Competencies = [...q4Knowledge, ...q4Skills, ...q4Judgement];
  
  if (allQ4Competencies.length > 0) {
    activities.push({
      id: `${moduleId}-q4-assessment`,
      title: generateActivityTitle(cluster, 'assessment'),
      description: generateActivityDescription(cluster, 'assessment'),
      parentModuleId: moduleId,
      parentModuleTitle: cluster.title,
      assignedQuarter: 'Q4',
      competencyCategory: 'assessment',
      durationMinutes: Math.max(30, allQ4Competencies.length * 15),
      linkedCompetencies: allQ4Competencies,
      linkedTaskIds: cluster.linkedTaskIds,
      riskCategories: linkedRisks,
      primaryRequirement: cluster.primaryRequirement,
      whyIncluded: `Competency assessment and embedding: ${generateWhyIncluded(cluster, roleName)}`,
      humanReviewRequired: true,
    });
  } else if (cluster.priority === 'critical' || cluster.priority === 'high') {
    // If no Q4 competencies found but module is high/critical priority, still create a Q4 assessment
    const assessmentCompetencies = [
      ...cluster.competencies.knowledge.slice(0, 1),
      ...cluster.competencies.skills.slice(0, 1),
      ...cluster.competencies.judgement.slice(0, 1),
    ].filter(Boolean);
    
    activities.push({
      id: `${moduleId}-q4-assessment`,
      title: generateActivityTitle(cluster, 'assessment'),
      description: generateActivityDescription(cluster, 'assessment'),
      parentModuleId: moduleId,
      parentModuleTitle: cluster.title,
      assignedQuarter: 'Q4',
      competencyCategory: 'assessment',
      durationMinutes: 30,
      linkedCompetencies: assessmentCompetencies,
      linkedTaskIds: cluster.linkedTaskIds,
      riskCategories: linkedRisks,
      primaryRequirement: cluster.primaryRequirement,
      whyIncluded: `Competency assessment: ${generateWhyIncluded(cluster, roleName)}`,
      humanReviewRequired: true,
    });
  }
  
  return activities;
}

/**
 * Get quarter title and description
 */
export function getQuarterInfo(quarter: TrainingQuarter): { title: string; description: string } {
  switch (quarter) {
    case 'Q1':
      return {
        title: 'Q1: Foundation & Knowledge',
        description: 'Core knowledge building - regulatory frameworks, policies, and procedures'
      };
    case 'Q2':
      return {
        title: 'Q2: Application & Skills',
        description: 'Practical skills development - applying knowledge to real-world scenarios'
      };
    case 'Q3':
      return {
        title: 'Q3: Deepening & Judgement',
        description: 'Advanced decision-making - complex case analysis and professional judgement'
      };
    case 'Q4':
      return {
        title: 'Q4: Assessment & Embedding',
        description: 'Competency validation - assessments, refreshers, and competency assurance'
      };
    default:
      return {
        title: quarter,
        description: ''
      };
  }
}

/**
 * Convert a competency cluster to a training module item
 */
export function clusterToModule(
  cluster: CompetencyCluster,
  roleName: string,
  index: number
): TrainingModuleItem {
  const priorityScore = calculatePriorityScore(cluster.priority, cluster.riskLevel);
  const quarter = determinePrimaryQuarter(cluster);
  
  // Generate learning objectives from competencies
  const learningObjectives: string[] = [];
  
  cluster.competencies.knowledge.forEach(k => {
    learningObjectives.push(`Understand ${k.toLowerCase()}`);
  });
  
  cluster.competencies.skills.forEach(s => {
    learningObjectives.push(`Demonstrate ability to ${s.toLowerCase()}`);
  });
  
  cluster.competencies.judgement.forEach(j => {
    learningObjectives.push(`Apply sound judgement in ${j.toLowerCase()}`);
  });
  
  // Determine assessment method based on competency mix
  const hasJudgement = cluster.competencies.judgement.length > 0;
  const hasSkills = cluster.competencies.skills.length > 0;
  const assessmentMethod = hasJudgement 
    ? 'case_review' 
    : hasSkills 
      ? 'scenario' 
      : 'quiz';
  
  // Cap duration by priority level (budget: 300-420 min total across all modules)
  const durationByPriority: Record<PriorityLevel, number> = {
    critical: 90,
    high: 75,
    medium: 60,
    low: 45,
  };
  const durationMinutes = durationByPriority[cluster.priority] ?? 60;

  // Derive linked risk tags from requirement name
  const linkedRisks = REQUIREMENT_TO_RISKS[cluster.primaryRequirement] ?? [cluster.riskLevel + '-risk'];

  // Full competency text grouped by category
  const linkedCompetenciesByCategory = {
    knowledge: [...cluster.competencies.knowledge],
    skills: [...cluster.competencies.skills],
    judgement: [...cluster.competencies.judgement],
  };

  // Human review reason (only when required)
  const reviewReason = cluster.humanReviewRequired
    ? generateReviewReason(cluster)
    : undefined;
  
  // Generate activities for this module
  const activities = splitClusterToActivities(cluster, roleName, index);
  
  return {
    moduleId: `module-${cluster.groupId}-${index}`,
    title: cluster.title,
    description: `Training module covering ${cluster.primaryRequirement} competencies for ${roleName} role.`,
    
    // Traceability
    linkedTaskIds: cluster.linkedTaskIds,
    linkedCompetencyIds: [],
    linkedRisks,
    primaryRequirement: cluster.primaryRequirement,
    regulatoryBasis: cluster.linkedRegulatoryBasis,
    
    // Competency coverage
    competencyCategoriesCovered: [
      ...(cluster.competencies.knowledge.length > 0 ? ['knowledge' as const] : []),
      ...(cluster.competencies.skills.length > 0 ? ['skills' as const] : []),
      ...(cluster.competencies.judgement.length > 0 ? ['judgement' as const] : []),
    ],
    linkedCompetenciesByCategory,
    
    // Learning design
    learningObjectives,
    assessmentMethod,
    
    // Logistics
    durationMinutes,
    quarter,
    priority: scoreToPriorityLabel(priorityScore),
    priorityScore,
    
    // Explainability
    whyIncluded: generateWhyIncluded(cluster, roleName),
    
    // Review
    humanReviewRequired: cluster.humanReviewRequired,
    reviewReason,
    
    // Activities breakdown
    activities,
  };
}

/**
 * Generate enhanced training plan from normalized competencies
 * This is the main entry point for the enhanced training plan generation
 */
export function generateEnhancedTrainingPlan(
  role: Role,
  normalizedCompetencies: NormalizedCompetency[]
): EnhancedTrainingPlan {
  // Cluster competencies
  const clusters = clusterCompetencies(normalizedCompetencies);
  
  // Convert clusters to modules
  const modules = clusters.map((cluster, index) => 
    clusterToModule(cluster, role.name, index + 1)
  );
  
  // Organize modules by quarter based on their activities
  // A module can appear in multiple quarters if it has activities in those quarters
  const quartersMap: Record<TrainingQuarter, TrainingModuleItem[]> = {
    Q1: [],
    Q2: [],
    Q3: [],
    Q4: [],
  };
  
  modules.forEach(module => {
    // Find all quarters this module has activities in
    const moduleQuarters = new Set<TrainingQuarter>([module.quarter]);
    module.activities.forEach(activity => {
      moduleQuarters.add(activity.assignedQuarter);
    });
    
    // Add module to all quarters it's involved in
    moduleQuarters.forEach(quarter => {
      quartersMap[quarter].push(module);
    });
  });
  
  // Collect all activities from all modules
  const allActivities = modules.flatMap(m => m.activities);
  
  // Build quarterly sections with activities
  const quarters: QuarterlySection[] = (['Q1', 'Q2', 'Q3', 'Q4'] as TrainingQuarter[])
    .map(quarter => {
      const info = getQuarterInfo(quarter);
      const quarterActivities = allActivities.filter(a => a.assignedQuarter === quarter);
      return {
        quarter,
        title: info.title,
        description: info.description,
        modules: quartersMap[quarter].sort((a, b) => b.priorityScore - a.priorityScore),
        activities: quarterActivities,
      };
    })
    .filter(section => section.modules.length > 0 || section.activities.length > 0);
  
  // Calculate statistics
  const totalModules = modules.length;
  const totalDurationMinutes = modules.reduce((sum, m) => sum + m.durationMinutes, 0);
  
  // Collect all linked IDs
  const linkedTaskIds = Array.from(new Set(modules.flatMap(m => m.linkedTaskIds)));
  const linkedRequirementIds = Array.from(new Set(modules.map(m => m.primaryRequirement)));
  const linkedCompetencyIds = Array.from(new Set(normalizedCompetencies.map(c => c.competencyId)));
  
  // Calculate quality score
  const qualityScore = calculateQualityScore(modules, normalizedCompetencies, clusters);
  
  return {
    roleId: role.id,
    roleName: role.name,
    generatedAt: new Date().toISOString(),
    
    quarters,
    totalModules,
    totalDurationMinutes,
    
    linkedTaskIds,
    linkedRequirementIds,
    linkedCompetencyIds,
    
    qualityScore,
    
    humanReviewRequired: modules.some(m => m.humanReviewRequired),
  };
}

/**
 * Calculate quality score for the training plan
 */
export function calculateQualityScore(
  modules: TrainingModuleItem[],
  normalizedCompetencies: NormalizedCompetency[],
  clusters: CompetencyCluster[]
): EnhancedTrainingPlan['qualityScore'] {
  // Risk coverage: % of high-risk tasks covered
  const highRiskTasks = new Set(
    normalizedCompetencies
      .filter(c => c.riskLevel === 'high')
      .map(c => c.taskId)
  );
  const coveredHighRiskTasks = new Set(
    modules.flatMap(m => m.linkedTaskIds).filter(id => highRiskTasks.has(id))
  );
  const riskCoverage = highRiskTasks.size > 0 
    ? Math.round((coveredHighRiskTasks.size / highRiskTasks.size) * 100)
    : 100;
  
  // Competency coverage: % of competencies covered by modules
  const competencyCoverage = clusters.length > 0
    ? Math.round((clusters.length / Math.max(clusters.length, 1)) * 100)
    : 0;
  
  // Regulatory traceability: % of modules with regulatory basis
  const modulesWithRegBasis = modules.filter(m => m.regulatoryBasis.length > 0).length;
  const regulatoryTraceability = modules.length > 0
    ? Math.round((modulesWithRegBasis / modules.length) * 100)
    : 0;
  
  // Overall score (weighted average)
  const overallScore = Math.round(
    riskCoverage * 0.4 + 
    competencyCoverage * 0.35 + 
    regulatoryTraceability * 0.25
  );
  
  return {
    riskCoverage,
    competencyCoverage,
    regulatoryTraceability,
    overallScore,
  };
}

/**
 * Generate a training plan based on role and retrieved requirements (rule-based)
 * Legacy function signature - maintained for backward compatibility
 */
export function generateTrainingPlanRuleBased(role: Role, requirements: AMLRRequirement[]): TrainingPlan {
  const items: TrainingPlanItem[] = [];

  // For each requirement, map the associated training modules
  requirements.forEach((req) => {
    req.trainingModuleIds.forEach((moduleId) => {
      const module = trainingModules.find((m) => m.id === moduleId);
      if (module) {
        // Calculate priority based on:
        // 1. Module priority (high=3, medium=2, low=1)
        // 2. Role risk level (high=3, medium=2, low=1)
        const modulePriorityScore =
          module.priority === 'high' ? 3 : module.priority === 'medium' ? 2 : 1;
        const roleRiskScore =
          role.riskLevel === 'high' ? 3 : role.riskLevel === 'medium' ? 2 : 1;

        // Combined priority (1-10 scale)
        const priority = Math.min(10, Math.round((modulePriorityScore * roleRiskScore * 10) / 9));

        items.push({
          module,
          requirement: req,
          priority,
          estimatedDuration: module.duration,
        });
      }
    });
  });

  // Remove duplicates (same module might be linked to multiple requirements)
  const uniqueItems = items.reduce((acc, item) => {
    const existing = acc.find((i) => i.module.id === item.module.id);
    if (existing) {
      // Keep the higher priority one
      if (item.priority > existing.priority) {
        acc[acc.indexOf(existing)] = item;
      }
    } else {
      acc.push(item);
    }
    return acc;
  }, [] as TrainingPlanItem[]);

  // Sort by priority (highest first)
  uniqueItems.sort((a, b) => b.priority - a.priority);

  // Calculate total duration
  const totalDuration = uniqueItems.reduce((sum, item) => sum + item.estimatedDuration, 0);

  return {
    roleId: role.id,
    roleName: role.name,
    items: uniqueItems,
    totalDuration,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get a summary of the training plan
 */
export function getTrainingPlanSummary(plan: TrainingPlan): {
  totalModules: number;
  totalDurationHours: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  moduleTypes: Record<string, number>;
} {
  const highPriorityCount = plan.items.filter((item) => item.priority >= 7).length;
  const mediumPriorityCount = plan.items.filter((item) => item.priority >= 4 && item.priority < 7).length;
  const lowPriorityCount = plan.items.filter((item) => item.priority < 4).length;

  const moduleTypes: Record<string, number> = {};
  plan.items.forEach((item) => {
    moduleTypes[item.module.type] = (moduleTypes[item.module.type] || 0) + 1;
  });

  return {
    totalModules: plan.items.length,
    totalDurationHours: Math.round((plan.totalDuration / 60) * 10) / 10,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    moduleTypes,
  };
}