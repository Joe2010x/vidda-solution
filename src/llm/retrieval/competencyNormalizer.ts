/**
 * Competency Normalizer / Enricher
 * 
 * Transforms raw competency needs from TaskRequirementMappings into
 * normalized, enriched competency objects with full traceability.
 * 
 * Does 4 things:
 * 1. Binds each competency to its source taskId (preserved from original extraction)
 * 2. Enriches with skills and judgement based on risk category
 * 3. Inherits requirement confidence and humanReviewRequired flags (layered approach)
 * 4. Assigns priority based on risk level, task type, and competency category
 */

import type { 
  TaskRequirementMapping, 
  NormalizedCompetency, 
  PriorityLevel, 
  ConfidenceStatus 
} from '@/types/retrieval';

/**
 * High-risk task keywords that indicate critical decision-making
 */
const HIGH_RISK_TASK_KEYWORDS = [
  'sar', 'suspicious activity report', 'suspicious',
  'edd', 'enhanced due diligence',
  'pep', 'politically exposed',
  'sanctions', 'asset freezing',
  'escalat', 'escalation',
  'mlro', 'money laundering reporting',
  'transaction monitoring', 'monitoring',
];

/**
 * Governance/training task keywords for medium priority
 */
const GOVERNANCE_TASK_KEYWORDS = [
  'policies', 'policy', 'governance',
  'training', 'mentorship', 'mentoring', 'coach',
  'documentation', 'record', 'admin',
];

/**
 * Task type keywords for skill/judgement enrichment
 */
const TASK_TYPE_KEYWORDS: Record<string, { skills: string[]; judgement: string[] }> = {
  'transaction monitoring': {
    skills: [
      'Analyse high-value transaction patterns',
      'Compare observed behaviour against expected customer profile',
      'Document alert review decisions clearly',
    ],
    judgement: [
      'Decide when an alert should be discounted, monitored, or escalated',
      'Recognise when weak evidence still requires escalation',
    ],
  },
  'sar': {
    skills: [
      'Write clear SAR rationale',
      'Prepare audit-ready case records',
      'Summarise suspicious indicators accurately',
    ],
    judgement: [
      'Decide when suspicious indicators meet reporting threshold',
      'Know when to escalate to Compliance Manager or MLRO',
      'Avoid tipping-off risk during investigation handling',
    ],
  },
  'suspicious': {
    skills: [
      'Write clear SAR rationale',
      'Prepare audit-ready case records',
      'Summarise suspicious indicators accurately',
    ],
    judgement: [
      'Decide when suspicious indicators meet reporting threshold',
      'Know when to escalate to Compliance Manager or MLRO',
      'Avoid tipping-off risk during investigation handling',
    ],
  },
  'edd': {
    skills: [
      'Verify source-of-funds evidence',
      'Assess plausibility of customer explanations',
      'Apply enhanced monitoring techniques',
    ],
    judgement: [
      'Determine when EDD evidence is insufficient',
      'Escalate high-risk uncertainty for senior review',
    ],
  },
  'policies': {
    skills: [
      'Translate AML policy into operational procedures',
      'Identify gaps in control design',
      'Collaborate with compliance officers on procedure updates',
    ],
    judgement: [
      'Assess whether controls are proportionate to actual risk exposure',
      'Recognise when policy gaps require escalation',
    ],
  },
  'policy': {
    skills: [
      'Translate AML policy into operational procedures',
      'Identify gaps in control design',
      'Collaborate with compliance officers on procedure updates',
    ],
    judgement: [
      'Assess whether controls are proportionate to actual risk exposure',
      'Recognise when policy gaps require escalation',
    ],
  },
  'training': {
    skills: [
      'Coach junior analysts on red flag detection',
      'Review junior analyst case decisions',
      'Give actionable feedback on documentation quality',
    ],
    judgement: [
      'Identify when junior analyst decisions create systemic risk',
      'Distinguish individual training gaps from control failures',
    ],
  },
  'mentorship': {
    skills: [
      'Coach junior analysts on red flag detection',
      'Review junior analyst case decisions',
      'Give actionable feedback on documentation quality',
    ],
    judgement: [
      'Identify when junior analyst decisions create systemic risk',
      'Distinguish individual training gaps from control failures',
    ],
  },
};

/**
 * Determine priority based on risk level, task type, and competency category
 * 
 * Rules:
 * - Critical: judgement + high-risk task (decision-making)
 * - High: skills/knowledge + high-risk task, or judgement + medium-risk
 * - Medium: governance, policy, training competencies
 * - Low: general awareness or non-core support
 */
function determinePriority(
  riskLevel: 'low' | 'medium' | 'high',
  taskDescription: string,
  category: 'knowledge' | 'skills' | 'judgement'
): PriorityLevel {
  const taskLower = taskDescription.toLowerCase();
  const isHighRiskTask = HIGH_RISK_TASK_KEYWORDS.some(kw => taskLower.includes(kw));
  const isGovernanceTask = GOVERNANCE_TASK_KEYWORDS.some(kw => taskLower.includes(kw));
  
  // Critical: judgement + high-risk task (decision-making for SAR/EDD/monitoring)
  if (category === 'judgement' && riskLevel === 'high' && isHighRiskTask) {
    return 'critical';
  }
  
  // High: skills/knowledge + high-risk task
  if (riskLevel === 'high' && isHighRiskTask && category !== 'judgement') {
    return 'high';
  }
  
  // High: judgement + medium-risk
  if (category === 'judgement' && riskLevel === 'medium') {
    return 'high';
  }
  
  // High: any high-risk task competency
  if (riskLevel === 'high') {
    return 'high';
  }
  
  // Medium: governance, policy, training tasks
  if (isGovernanceTask) {
    return 'medium';
  }
  
  // Medium: medium-risk tasks
  if (riskLevel === 'medium') {
    return 'medium';
  }
  
  // Low: everything else
  return 'low';
}

/**
 * Determine confidence status based on requirement confidence
 */
function determineConfidenceStatus(avgConfidence: number): ConfidenceStatus {
  if (avgConfidence >= 0.85) {
    return 'verified';
  }
  if (avgConfidence >= 0.65) {
    return 'tentative';
  }
  return 'assumed';
}

/**
 * Check if human review is required - layered approach
 * 
 * Rules:
 * - verified → generally no review needed
 * - assumed → always requires review
 * - tentative → depends on risk level and category
 */
function requiresHumanReview(
  confidenceStatus: ConfidenceStatus,
  riskLevel: 'low' | 'medium' | 'high',
  category: 'knowledge' | 'skills' | 'judgement'
): boolean {
  // Verified competencies generally don't need review
  if (confidenceStatus === 'verified') {
    return false;
  }
  
  // Assumed always needs review
  if (confidenceStatus === 'assumed') {
    return true;
  }
  
  // Tentative: depends on risk and category
  if (confidenceStatus === 'tentative') {
    // High-risk tasks with tentative confidence need review
    if (riskLevel === 'high') {
      return true;
    }
    // Judgement competencies with tentative confidence need review
    if (category === 'judgement') {
      return true;
    }
    // Medium/low risk knowledge/skills can proceed without review
    return false;
  }
  
  return false;
}

/**
 * Get enriched skills for a task type
 */
function getEnrichedSkills(taskDescription: string): string[] {
  const taskLower = taskDescription.toLowerCase();
  for (const [keyword, enrichment] of Object.entries(TASK_TYPE_KEYWORDS)) {
    if (taskLower.includes(keyword)) {
      return enrichment.skills;
    }
  }
  return [];
}

/**
 * Get enriched judgement for a task type
 */
function getEnrichedJudgement(taskDescription: string): string[] {
  const taskLower = taskDescription.toLowerCase();
  for (const [keyword, enrichment] of Object.entries(TASK_TYPE_KEYWORDS)) {
    if (taskLower.includes(keyword)) {
      return enrichment.judgement;
    }
  }
  return [];
}

/**
 * Generate a unique competency ID
 */
function generateCompetencyId(
  taskId: string,
  requirementTitle: string,
  index: number
): string {
  const reqShort = requirementTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 10)
    .replace(/-+$/, '');
  
  return `comp-${taskId}-${reqShort}-${String(index + 1).padStart(3, '0')}`;
}

/**
 * Normalize and enrich competencies from task requirement mappings
 * 
 * @param mappings - Array of task-requirement mappings from retrieval
 * @returns Array of normalized competency objects
 */
export function normalizeCompetencies(
  mappings: TaskRequirementMapping[]
): NormalizedCompetency[] {
  const normalized: NormalizedCompetency[] = [];
  
  mappings.forEach((mapping, mappingIndex) => {
    // IMPORTANT: Use taskId and taskDescription directly from mapping
    // These are preserved from the original extraction and must not be modified
    const { taskId, taskDescription, riskLevel, requirements, suggestedCompetencyNeeds } = mapping;
    
    // Calculate average confidence from requirements
    const avgConfidence = requirements.length > 0
      ? requirements.reduce((sum, r) => sum + r.confidence, 0) / requirements.length
      : 0.5;
    
    // Get confidence status
    const confidenceStatus = determineConfidenceStatus(avgConfidence);
    
    // Get linked regulatory basis from requirements
    const linkedRegulatoryBasis = Array.from(
      new Set(requirements.map(r => r.regulatoryBasis.article))
    );
    
    // Get primary and supporting requirements
    const primaryReq = requirements.find(r => r.mappingRole === 'primary') 
      || requirements.find(r => r.mappingRole === 'supporting')
      || requirements[0];
    const primaryRequirement = primaryReq?.businessRequirement.title || 'Unknown';
    
    // Get supporting requirements (all non-primary)
    const supportingRequirements = requirements
      .filter(r => r !== primaryReq)
      .map(r => r.businessRequirement.title)
      .filter((title, idx, arr) => arr.indexOf(title) === idx); // Remove duplicates
    
    // Process knowledge competencies
    suggestedCompetencyNeeds.knowledge.forEach((text) => {
      normalized.push({
        competencyId: generateCompetencyId(taskId, primaryRequirement, normalized.length),
        taskId,
        taskDescription,
        category: 'knowledge',
        text,
        primaryRequirement,
        supportingRequirements,
        linkedRegulatoryBasis,
        riskLevel,
        priority: determinePriority(riskLevel, taskDescription, 'knowledge'),
        confidenceStatus,
        humanReviewRequired: requiresHumanReview(confidenceStatus, riskLevel, 'knowledge'),
        sourceMappingIndex: mappingIndex,
      });
    });
    
    // Process skills competencies
    const enrichedSkills = getEnrichedSkills(taskDescription);
    const allSkills = Array.from(new Set([...suggestedCompetencyNeeds.skills, ...enrichedSkills]));
    
    allSkills.forEach((text) => {
      normalized.push({
        competencyId: generateCompetencyId(taskId, primaryRequirement, normalized.length),
        taskId,
        taskDescription,
        category: 'skills',
        text,
        primaryRequirement,
        supportingRequirements,
        linkedRegulatoryBasis,
        riskLevel,
        priority: determinePriority(riskLevel, taskDescription, 'skills'),
        confidenceStatus,
        humanReviewRequired: requiresHumanReview(confidenceStatus, riskLevel, 'skills'),
        sourceMappingIndex: mappingIndex,
      });
    });
    
    // Process judgement competencies
    const enrichedJudgement = getEnrichedJudgement(taskDescription);
    const allJudgement = Array.from(new Set([...suggestedCompetencyNeeds.judgement, ...enrichedJudgement]));
    
    allJudgement.forEach((text) => {
      normalized.push({
        competencyId: generateCompetencyId(taskId, primaryRequirement, normalized.length),
        taskId,
        taskDescription,
        category: 'judgement',
        text,
        primaryRequirement,
        supportingRequirements,
        linkedRegulatoryBasis,
        riskLevel,
        priority: determinePriority(riskLevel, taskDescription, 'judgement'),
        confidenceStatus,
        humanReviewRequired: requiresHumanReview(confidenceStatus, riskLevel, 'judgement'),
        sourceMappingIndex: mappingIndex,
      });
    });
  });
  
  return normalized;
}

/**
 * Get competency statistics
 */
export function getCompetencyStats(competencies: NormalizedCompetency[]) {
  return {
    total: competencies.length,
    byCategory: {
      knowledge: competencies.filter(c => c.category === 'knowledge').length,
      skills: competencies.filter(c => c.category === 'skills').length,
      judgement: competencies.filter(c => c.category === 'judgement').length,
    },
    byPriority: {
      critical: competencies.filter(c => c.priority === 'critical').length,
      high: competencies.filter(c => c.priority === 'high').length,
      medium: competencies.filter(c => c.priority === 'medium').length,
      low: competencies.filter(c => c.priority === 'low').length,
    },
    requiringReview: competencies.filter(c => c.humanReviewRequired).length,
    byConfidence: {
      verified: competencies.filter(c => c.confidenceStatus === 'verified').length,
      tentative: competencies.filter(c => c.confidenceStatus === 'tentative').length,
      assumed: competencies.filter(c => c.confidenceStatus === 'assumed').length,
    },
  };
}