import { Role, AMLRRequirement } from '@/types';
import { amlrRequirements } from '@/data/amlrRequirements';
import type { 
  RiskMapping, 
  MatchedRequirement, 
  EnhancedRetrievalResult, 
  TaskRequirementMapping,
  MatchedRequirementDetail,
  CompetencyNeedSummary,
  RetrievalSummary,
  RetrievalValidation,
  CoverageCheck 
} from '@/types/retrieval';

// Keyword mapping from role tasks to risk categories
const taskToRiskCategoryMap: Record<string, string[]> = {
  // CDD-related tasks
  'verify customer identification': ['customer-identification'],
  'customer identification': ['customer-identification'],
  'identify documents': ['customer-identification'],
  kyc: ['customer-identification', 'ongoing-monitoring'],
  'customer due diligence': ['customer-identification', 'beneficial-ownership'],
  cdd: ['customer-identification', 'beneficial-ownership'],
  onboarding: ['customer-identification'],

  // EDD-related tasks
  'high-risk': ['pep', 'high-risk-country', 'complex-transactions'],
  pep: ['pep'],
  'politically exposed': ['pep'],
  'enhanced due diligence': ['pep', 'high-risk-country'],
  edd: ['pep', 'high-risk-country'],
  'beneficial ownership': ['beneficial-ownership'],
  'source of wealth': ['pep', 'high-risk-country'],

  // Suspicious activity-related tasks
  suspicious: ['suspicious-activity', 'reporting'],
  'suspicious activity': ['suspicious-activity', 'reporting'],
  sar: ['suspicious-activity', 'reporting'],
  'suspicious activity report': ['suspicious-activity', 'reporting'],
  'red flag': ['suspicious-activity'],
  'unusual transaction': ['suspicious-activity'],
  escalate: ['suspicious-activity', 'reporting'],
  'tipping-off': ['tipping-off'],

  // Sanctions-related tasks
  sanctions: ['sanctions', 'screening'],
  'sanctions list': ['sanctions', 'screening'],
  screening: ['sanctions', 'screening'],
  screen: ['sanctions', 'screening'],
  'asset freezing': ['asset-freezing'],
  freeze: ['asset-freezing'],

  // Risk assessment-related tasks
  'risk assessment': ['risk-assessment', 'ml-tf-risk'],
  risk: ['risk-assessment'],
  'money laundering': ['ml-tf-risk'],
  'ml/tf': ['ml-tf-risk'],
  'terrorist financing': ['ml-tf-risk'],
  'risk rating': ['risk-assessment'],
  'risk metrics': ['risk-assessment'],
  'risk indicators': ['risk-assessment'],
  'inherent risk': ['inherent-risk'],

  // Record keeping-related tasks
  record: ['documentation', 'record-keeping'],
  records: ['documentation', 'record-keeping'],
  documentation: ['documentation', 'record-keeping'],
  document: ['documentation', 'record-keeping'],
  audit: ['audit-trail', 'record-keeping'],
  retention: ['record-keeping'],

  // Compliance and governance-related tasks
  compliance: ['internal-controls', 'policies'],
  policy: ['policies', 'internal-controls'],
  policies: ['policies', 'internal-controls'],
  procedures: ['internal-controls', 'policies'],
  controls: ['internal-controls'],
  'internal controls': ['internal-controls'],
  governance: ['governance', 'internal-controls'],
  regulatory: ['internal-controls', 'policies'],
  approve: ['internal-controls', 'governance'],
  review: ['ongoing-monitoring', 'risk-assessment'],
  monitor: ['ongoing-monitoring'],
  monitoring: ['ongoing-monitoring'],
  examination: ['internal-controls', 'documentation'],
  investigate: ['suspicious-activity', 'reporting'],
  breach: ['internal-controls', 'reporting'],
  transaction: ['suspicious-activity', 'ongoing-monitoring'],
  'customer risk': ['risk-assessment'],
  'third-party': ['risk-assessment', 'ml-tf-risk'],
  periodic: ['ongoing-monitoring', 'record-keeping'],
  report: ['reporting', 'governance'],
  'senior management': ['governance', 'internal-controls'],
  'allocate resources': ['governance', 'internal-controls'],
  'risk appetite': ['governance', 'risk-assessment'],
  training: ['internal-controls', 'policies'],
};

/**
 * Extract risk categories from role tasks using keyword matching
 */
export function extractRiskCategories(tasks: string[]): string[] {
  const riskCategories = new Set<string>();
  const taskText = tasks.join(' ').toLowerCase();

  for (const [keyword, categories] of Object.entries(taskToRiskCategoryMap)) {
    if (taskText.includes(keyword.toLowerCase())) {
      categories.forEach((cat) => riskCategories.add(cat));
    }
  }

  return Array.from(riskCategories);
}

/**
 * Retrieve relevant AMLR requirements based on role tasks and risk categories
 * Uses a simple keyword-based matching algorithm
 */
export function retrieveRequirementsRuleBased(role: Role): {
  requirements: AMLRRequirement[];
  mappedRisks: string[];
} {
  // Extract risk categories from tasks
  const mappedRisks = extractRiskCategories(role.tasks);

  // Score each requirement based on risk category matches
  const scoredRequirements = amlrRequirements.map((req) => {
    const matchingCategories = req.riskCategories.filter((cat) => mappedRisks.includes(cat));
    const score = matchingCategories.length;
    return { requirement: req, score };
  });

  // Filter requirements with at least one match and sort by score
  const matchedRequirements = scoredRequirements
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ requirement }) => requirement);

  // For high-risk roles, include all high-priority requirements even without direct match
  if (role.riskLevel === 'high') {
    const existingIds = new Set(matchedRequirements.map((r) => r.id));
    amlrRequirements.forEach((req) => {
      if (!existingIds.has(req.id) && req.riskCategories.includes('governance')) {
        matchedRequirements.push(req);
      }
    });
  }

  return {
    requirements: matchedRequirements,
    mappedRisks,
  };
}

/**
 * Get competency needs based on retrieved requirements
 */
export function getCompetencyNeeds(requirements: AMLRRequirement[]): string[] {
  const competencies = new Set<string>();
  requirements.forEach((req) => {
    req.competencyRequirements.forEach((comp) => competencies.add(comp));
  });
  return Array.from(competencies);
}

/**
 * Enhanced retrieval with task-level traceability
 * Returns structured mappings from tasks to risks to requirements
 */
export function retrieveRequirementsEnhanced(role: Role): EnhancedRetrievalResult {
  const taskRequirementMappings: TaskRequirementMapping[] = [];
  const allRiskCategories = new Set<string>();
  const highRiskTasks: string[] = [];
  const mediumRiskTasks: string[] = [];
  const lowRiskTasks: string[] = [];
  const lowConfidenceMappings: string[] = [];
  const uncoveredRisks: string[] = [];

  // Process each task
  role.tasks.forEach((task, index) => {
    const taskId = `task-${index + 1}`;
    const taskRiskCategories = extractRiskCategories([task]);
    
    if (taskRiskCategories.length === 0) {
      return; // Skip tasks with no identified risks
    }

    taskRiskCategories.forEach(cat => allRiskCategories.add(cat));

    // Determine risk level based on category
    const riskLevel = determineRiskLevel(taskRiskCategories, role.riskLevel);
    
    // Track risk tasks
    if (riskLevel === 'high') highRiskTasks.push(taskId);
    else if (riskLevel === 'medium') mediumRiskTasks.push(taskId);
    else lowRiskTasks.push(taskId);

    // Match requirements for this task
    const matchedReqs = matchRequirementsToTask(taskRiskCategories);
    
    if (matchedReqs.length === 0) {
      uncoveredRisks.push(...taskRiskCategories);
      return;
    }

    // Check for low confidence mappings
    matchedReqs.forEach(req => {
      if (req.confidence < 0.7) {
        lowConfidenceMappings.push(`${taskId}: ${req.title}`);
      }
    });

    // Build competency needs from requirements
    const competencyNeeds = buildCompetencyNeeds(matchedReqs);

    taskRequirementMappings.push({
      taskId,
      taskDescription: task,
      riskCategory: taskRiskCategories.join(', '),
      riskLevel,
      requirements: matchedReqs,
      suggestedCompetencyNeeds: competencyNeeds,
    });
  });

  // Calculate summary
  const summary: RetrievalSummary = {
    totalTasks: role.tasks.length,
    highRiskTasks: highRiskTasks.length,
    mediumRiskTasks: mediumRiskTasks.length,
    lowRiskTasks: lowRiskTasks.length,
    uniqueRiskCategories: Array.from(allRiskCategories),
    matchedRequirementCount: taskRequirementMappings.reduce(
      (sum, m) => sum + m.requirements.length, 0
    ),
    avgConfidence: calculateAvgConfidence(taskRequirementMappings),
  };

  // Validate coverage
  const validation: RetrievalValidation = {
    allHighRisksCovered: highRiskTasks.length === 0 || 
      taskRequirementMappings.filter(m => m.riskLevel === 'high').length > 0,
    uncoveredRisks: Array.from(new Set(uncoveredRisks)),
    lowConfidenceMappings,
    needsHumanReview: lowConfidenceMappings.length > 0 || uncoveredRisks.length > 0,
    reviewReasons: buildReviewReasons(lowConfidenceMappings, uncoveredRisks),
  };

  return {
    roleId: role.id,
    roleName: role.name,
    taskRequirementMappings,
    summary,
    validation,
  };
}

/**
 * Match AMLR requirements to task risk categories
 */
function matchRequirementsToTask(riskCategories: string[]): MatchedRequirementDetail[] {
  return amlrRequirements
    .map(req => {
      const matchingCategories = req.riskCategories.filter(cat => 
        riskCategories.some(rc => rc.toLowerCase().includes(cat.toLowerCase()) || 
                                 cat.toLowerCase().includes(rc.toLowerCase()))
      );
      
      if (matchingCategories.length === 0) return null;

      const confidence = Math.min(1, matchingCategories.length / req.riskCategories.length) * (req.confidence || 0.8);

      return {
        id: req.id,
        title: req.title,
        article: req.article || 'Unknown',
        sourceExcerpt: req.sourceExcerpt || '',
        relevanceReason: req.relevanceReason || '',
        confidence: Math.round(confidence * 100) / 100,
      };
    })
    .filter((req): req is MatchedRequirementDetail => req !== null)
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Build competency needs from matched requirements
 */
function buildCompetencyNeeds(requirements: MatchedRequirementDetail[]): CompetencyNeedSummary {
  const knowledge: string[] = [];
  const skills: string[] = [];
  const judgement: string[] = [];

  requirements.forEach(req => {
    const fullReq = amlrRequirements.find(r => r.id === req.id);
    if (fullReq) {
      fullReq.competencyRequirements.forEach(comp => {
        if (comp.toLowerCase().includes('knowledge') || comp.toLowerCase().includes('understanding')) {
          knowledge.push(comp);
        } else if (comp.toLowerCase().includes('ability') || comp.toLowerCase().includes('technique')) {
          skills.push(comp);
        } else if (comp.toLowerCase().includes('judgement') || comp.toLowerCase().includes('decision')) {
          judgement.push(comp);
        } else {
          // Default to knowledge
          knowledge.push(comp);
        }
      });
    }
  });

  return {
    knowledge: Array.from(new Set(knowledge)),
    skills: Array.from(new Set(skills)),
    judgement: Array.from(new Set(judgement)),
  };
}

/**
 * Determine risk level for a task based on categories and role risk
 */
function determineRiskLevel(riskCategories: string[], roleRiskLevel: string): 'low' | 'medium' | 'high' {
  const highRiskCategories = ['pep', 'suspicious-activity', 'sanctions', 'high-risk-country'];
  const mediumRiskCategories = ['customer-identification', 'beneficial-ownership', 'risk-assessment'];
  
  if (riskCategories.some(cat => highRiskCategories.includes(cat))) {
    return 'high';
  }
  
  if (riskCategories.some(cat => mediumRiskCategories.includes(cat))) {
    return roleRiskLevel === 'high' ? 'high' : 'medium';
  }
  
  return roleRiskLevel === 'high' ? 'medium' : 'low';
}

/**
 * Calculate average confidence across all mappings
 */
function calculateAvgConfidence(mappings: TaskRequirementMapping[]): number {
  const allConfidences = mappings.flatMap(m => m.requirements.map(r => r.confidence));
  if (allConfidences.length === 0) return 0;
  return Math.round((allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length) * 100) / 100;
}

/**
 * Build review reasons for validation
 */
function buildReviewReasons(lowConfidenceMappings: string[], uncoveredRisks: string[]): string[] {
  const reasons: string[] = [];
  
  if (lowConfidenceMappings.length > 0) {
    reasons.push(`${lowConfidenceMappings.length} low-confidence requirement mappings detected`);
  }
  
  if (uncoveredRisks.length > 0) {
    reasons.push(`Risk categories without requirement coverage: ${uncoveredRisks.join(', ')}`);
  }
  
  return reasons;
}

/**
 * Perform coverage check on retrieval results
 */
export function checkCoverage(role: Role, result: EnhancedRetrievalResult): CoverageCheck {
  const highRiskMappings = result.taskRequirementMappings.filter(m => m.riskLevel === 'high');
  const mediumRiskMappings = result.taskRequirementMappings.filter(m => m.riskLevel === 'medium');
  const lowRiskMappings = result.taskRequirementMappings.filter(m => m.riskLevel === 'low');

  const highRiskTasks = role.tasks.filter(task => {
    const cats = extractRiskCategories([task]);
    return cats.some(cat => ['pep', 'suspicious-activity', 'sanctions', 'high-risk-country'].includes(cat));
  });

  const uncoveredHighRiskTasks = highRiskTasks.filter(task => 
    !result.taskRequirementMappings.some(m => m.taskDescription === task && m.riskLevel === 'high')
  );

  const recommendations: string[] = [];
  
  if (uncoveredHighRiskTasks.length > 0) {
    recommendations.push('Review high-risk tasks without requirement coverage');
  }
  
  if (result.validation.lowConfidenceMappings.length > 0) {
    recommendations.push('Review low-confidence requirement mappings');
  }
  
  if (result.summary.avgConfidence < 0.7) {
    recommendations.push('Overall confidence is low - consider manual review');
  }

  return {
    highRiskCoverage: highRiskTasks.length > 0 
      ? Math.round((highRiskMappings.length / Math.max(highRiskTasks.length, 1)) * 100)
      : 100,
    mediumRiskCoverage: mediumRiskMappings.length > 0 
      ? Math.round((mediumRiskMappings.length / Math.max(
          role.tasks.filter(t => {
            const cats = extractRiskCategories([t]);
            return cats.some(cat => ['customer-identification', 'beneficial-ownership', 'risk-assessment'].includes(cat));
          }).length, 1)) * 100)
      : 100,
    lowRiskCoverage: lowRiskMappings.length > 0 
      ? Math.round((lowRiskMappings.length / Math.max(
          role.tasks.length - highRiskTasks.length - 
          role.tasks.filter(t => {
            const cats = extractRiskCategories([t]);
            return cats.some(cat => ['customer-identification', 'beneficial-ownership', 'risk-assessment'].includes(cat));
          }).length, 1)) * 100)
      : 100,
    uncoveredHighRiskTasks,
    uncoveredRiskCategories: result.validation.uncoveredRisks,
    recommendations,
  };
}