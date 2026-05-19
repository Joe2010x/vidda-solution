/**
 * Competency Clusterer
 * 
 * Groups normalized competencies into clusters for training module generation.
 * Instead of generating one module per competency (which could be 40+),
 * this clusters them by primary requirement + task group to produce 6-10 modules.
 * 
 * Clustering strategy:
 * 1. Group by primaryRequirement (e.g., "Suspicious Activity Reporting")
 * 2. Within each requirement, merge competencies from related tasks
 * 3. Generate a descriptive title for each cluster
 */

import type { 
  NormalizedCompetency, 
  CompetencyCluster, 
  PriorityLevel 
} from '@/types/retrieval';

/**
 * Generate a cluster ID from requirement title
 */
function generateClusterId(requirementTitle: string): string {
  return requirementTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a descriptive title for a cluster based on its competencies
 */
function generateClusterTitle(
  primaryRequirement: string,
  competencies: {
    knowledge: string[];
    skills: string[];
    judgement: string[];
  }
): string {
  // Map common requirements to better titles
  const titleMap: Record<string, string> = {
    'Suspicious Activity Reporting': 'Suspicious Activity Reporting and Escalation Decisions',
    'Enhanced Due Diligence': 'Enhanced Due Diligence and High-Risk Customer Assessment',
    'Customer Due Diligence': 'Customer Due Diligence and Onboarding Procedures',
    'Internal Controls and Governance': 'AML Internal Controls and Governance',
    'Risk Assessment': 'Risk-Based Assessment and Decision Making',
    'Record Keeping': 'Documentation and Record-Keeping Requirements',
    'Training and Awareness': 'AML Training and Competency Development',
    'Sanctions Compliance': 'Sanctions Screening and Asset Freezing',
    'PEP Management': 'Politically Exposed Persons (PEP) Management',
    'Beneficial Ownership': 'Beneficial Ownership Identification and Verification',
  };

  if (titleMap[primaryRequirement]) {
    return titleMap[primaryRequirement];
  }

  // Fallback: generate from competencies
  const allCompetencies = [...competencies.knowledge, ...competencies.skills, ...competencies.judgement];
  if (allCompetencies.length > 0) {
    // Use the first competency as base
    const firstComp = allCompetencies[0];
    return `${primaryRequirement}: ${firstComp}`;
  }

  return primaryRequirement;
}

/**
 * Determine the highest priority from an array of competencies
 */
function getHighestPriority(competencies: NormalizedCompetency[]): PriorityLevel {
  const priorityOrder = ['critical', 'high', 'medium', 'low'];
  
  for (const priority of priorityOrder) {
    if (competencies.some(c => c.priority === priority)) {
      return priority as PriorityLevel;
    }
  }
  
  return 'medium';
}

/**
 * Determine the highest risk level from an array of competencies
 */
function getHighestRiskLevel(competencies: NormalizedCompetency[]): 'low' | 'medium' | 'high' {
  const riskOrder = ['high', 'medium', 'low'];
  
  for (const risk of riskOrder) {
    if (competencies.some(c => c.riskLevel === risk)) {
      return risk as 'low' | 'medium' | 'high';
    }
  }
  
  return 'medium';
}

/**
 * Cluster normalized competencies into groups for training module generation
 * 
 * @param competencies - Array of normalized competencies
 * @returns Array of competency clusters
 */
export function clusterCompetencies(competencies: NormalizedCompetency[]): CompetencyCluster[] {
  // Group by primaryRequirement
  const groupedByRequirement = new Map<string, NormalizedCompetency[]>();
  
  competencies.forEach(comp => {
    const key = comp.primaryRequirement;
    const existing = groupedByRequirement.get(key) || [];
    existing.push(comp);
    groupedByRequirement.set(key, existing);
  });

  const clusters: CompetencyCluster[] = [];

  groupedByRequirement.forEach((comps, requirement) => {
    // Collect unique task IDs
    const linkedTaskIds = Array.from(new Set(comps.map(c => c.taskId)));
    
    // Collect unique regulatory basis
    const linkedRegulatoryBasis = Array.from(new Set(comps.flatMap(c => c.linkedRegulatoryBasis)));
    
    // Collect unique supporting requirements
    const supportingRequirements = Array.from(new Set(comps.flatMap(c => c.supportingRequirements)));
    
    // Group competencies by category
    const groupedCompetencies = {
      knowledge: Array.from(new Set(comps.filter(c => c.category === 'knowledge').map(c => c.text))),
      skills: Array.from(new Set(comps.filter(c => c.category === 'skills').map(c => c.text))),
      judgement: Array.from(new Set(comps.filter(c => c.category === 'judgement').map(c => c.text))),
    };

    // Determine if any competency in the cluster requires human review
    const humanReviewRequired = comps.some(c => c.humanReviewRequired);

    clusters.push({
      groupId: generateClusterId(requirement),
      title: generateClusterTitle(requirement, groupedCompetencies),
      linkedTaskIds,
      primaryRequirement: requirement,
      supportingRequirements,
      riskLevel: getHighestRiskLevel(comps),
      priority: getHighestPriority(comps),
      competencies: groupedCompetencies,
      linkedRegulatoryBasis,
      humanReviewRequired,
    });
  });

  // Sort clusters by priority
  const priorityOrder = ['critical', 'high', 'medium', 'low'];
  clusters.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.priority);
    const bIndex = priorityOrder.indexOf(b.priority);
    return aIndex - bIndex;
  });

  return clusters;
}

/**
 * Get cluster statistics
 */
export function getClusterStats(clusters: CompetencyCluster[]) {
  return {
    totalClusters: clusters.length,
    byPriority: {
      critical: clusters.filter(c => c.priority === 'critical').length,
      high: clusters.filter(c => c.priority === 'high').length,
      medium: clusters.filter(c => c.priority === 'medium').length,
      low: clusters.filter(c => c.priority === 'low').length,
    },
    requiringReview: clusters.filter(c => c.humanReviewRequired).length,
    avgTasksPerCluster: clusters.reduce((sum, c) => sum + c.linkedTaskIds.length, 0) / clusters.length,
    totalCompetencies: clusters.reduce((sum, c) => 
      sum + c.competencies.knowledge.length + c.competencies.skills.length + c.competencies.judgement.length, 0
    ),
  };
}