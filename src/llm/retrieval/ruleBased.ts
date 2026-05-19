import { Role, AMLRRequirement } from '@/types';
import { amlrRequirements } from '@/data/amlrRequirements';

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
