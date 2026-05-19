/**
 * Competency Normalizer / Enricher
 * 
 * Transforms raw competency needs from TaskRequirementMappings into
 * normalized, enriched competency objects with full traceability.
 * 
 * Does 4 things:
 * 1. Binds each competency to its source taskId
 * 2. Enriches with skills and judgement based on risk category
 * 3. Inherits requirement confidence and humanReviewRequired flags
 * 4. Assigns priority based on risk level and task type
 */

import type { 
  TaskRequirementMapping, 
  NormalizedCompetency, 
  PriorityLevel, 
  ConfidenceStatus 
} from '@/types/retrieval';

/**
 * High-risk task keywords that trigger critical priority
 */
const HIGH_RISK_TASK_KEYWORDS = [
  'sar', 'suspicious activity report', 'suspicious',
  'edd', 'enhanced due diligence',
  'pep', 'politically exposed',
  'sanctions', 'asset freezing',
  'escalat', 'escalation',
  'mlro', 'money laundering reporting',
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
};

/**
 * Determine priority based on risk level and task type
 */
function determinePriority(
  riskLevel: 'low' | 'medium' | 'high',
  taskDescription: string
): PriorityLevel {
  const taskLower = taskDescription.toLowerCase();
  
  // High risk + high-risk task keywords = critical
  if (riskLevel === 'high' && HIGH_RISK_TASK_KEYWORDS.some(kw => taskLower.includes(kw))) {
    return 'critical';
  }
  
  // High risk = high priority
  if (riskLevel === 'high') {
    return 'high';
  }
  
  // Medium risk = medium priority
  if (riskLevel === 'medium') {
    return 'medium';
  }
  
  // Low risk = low priority
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
 * Check if human review is required
 */
function requiresHumanReview(
  riskLevel: 'low' | 'medium' | 'high',
  confidence: number,
  category: 'knowledge' | 'skills' | 'judgement'
): boolean {
  // High risk always requires review
  if (riskLevel === 'high') return true;
  
  // Low confidence requires review
  if (confidence < 0.7) return true;
  
  // Judgement competencies require review
  if (category === 'judgement') return true;
  
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
    const { taskId, taskDescription, riskLevel, requirements, suggestedCompetencyNeeds } = mapping;
    
    // Calculate average confidence from requirements
    const avgConfidence = requirements.length > 0
      ? requirements.reduce((sum, r) => sum + r.confidence, 0) / requirements.length
      : 0.5;
    
    // Get linked regulatory basis from requirements
    const linkedRegulatoryBasis = Array.from(
      new Set(requirements.map(r => r.regulatoryBasis.article))
    );
    
    // Get linked requirement (primary requirement title)
    const primaryRequirement = requirements.find(r => r.mappingRole === 'primary') 
      || requirements[0];
    const linkedRequirement = primaryRequirement?.businessRequirement.title || 'Unknown';
    
    // Process knowledge competencies
    suggestedCompetencyNeeds.knowledge.forEach((text, idx) => {
      normalized.push({
        competencyId: generateCompetencyId(taskId, linkedRequirement, normalized.length),
        taskId,
        taskDescription,
        category: 'knowledge',
        text,
        linkedRequirement,
        linkedRegulatoryBasis,
        riskLevel,
        priority: determinePriority(riskLevel, taskDescription),
        confidenceStatus: determineConfidenceStatus(avgConfidence),
        humanReviewRequired: requiresHumanReview(riskLevel, avgConfidence, 'knowledge'),
        sourceMappingIndex: mappingIndex,
      });
    });
    
    // Process skills competencies
    const enrichedSkills = getEnrichedSkills(taskDescription);
    const allSkills = Array.from(new Set([...suggestedCompetencyNeeds.skills, ...enrichedSkills]));
    
    allSkills.forEach((text, idx) => {
      normalized.push({
        competencyId: generateCompetencyId(taskId, linkedRequirement, normalized.length),
        taskId,
        taskDescription,
        category: 'skills',
        text,
        linkedRequirement,
        linkedRegulatoryBasis,
        riskLevel,
        priority: determinePriority(riskLevel, taskDescription),
        confidenceStatus: determineConfidenceStatus(avgConfidence),
        humanReviewRequired: requiresHumanReview(riskLevel, avgConfidence, 'skills'),
        sourceMappingIndex: mappingIndex,
      });
    });
    
    // Process judgement competencies
    const enrichedJudgement = getEnrichedJudgement(taskDescription);
    const allJudgement = Array.from(new Set([...suggestedCompetencyNeeds.judgement, ...enrichedJudgement]));
    
    allJudgement.forEach((text, idx) => {
      normalized.push({
        competencyId: generateCompetencyId(taskId, linkedRequirement, normalized.length),
        taskId,
        taskDescription,
        category: 'judgement',
        text,
        linkedRequirement,
        linkedRegulatoryBasis,
        riskLevel,
        priority: determinePriority(riskLevel, taskDescription),
        confidenceStatus: determineConfidenceStatus(avgConfidence),
        humanReviewRequired: requiresHumanReview(riskLevel, avgConfidence, 'judgement'),
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