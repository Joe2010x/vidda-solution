/**
 * Rule-based risk normalizer
 * Provides a safety net to correct obvious LLM misclassifications
 * and ensure consistency between task-level risks and overall risk assessment
 */

import type { ParsedJobDescription, ParsedTask, RiskHint, RiskCategory } from '@/types';

// Keywords that indicate high-risk activities
const HIGH_RISK_KEYWORDS = [
  // AML/MLRO responsibilities
  'mlro', 'money laundering reporting officer', 'suspicious activity report', 'sar',
  'suspicious activity', 'suspicious transaction',
  // Transaction approval/rejection
  'approve transaction', 'reject transaction', 'authorize payment',
  'approve customer', 'reject customer', 'onboard customer',
  // High-risk customer handling
  'pep', 'politically exposed person', 'high-risk customer', 'high net worth',
  'enhanced due diligence', 'edd', 'high-risk jurisdiction',
  // Sanctions
  'sanctions screening', 'sanctions list', 'ofac', 'un sanctions',
  'asset freezing', 'designated person',
  // Investigation and escalation
  'investigate alert', 'investigate case', 'escalate to compliance',
  'regulatory reporting', 'fiu report',
  // Governance
  'aml framework', 'compliance officer', 'aml policy', 'cft policy'
];

// Keywords that indicate medium-risk activities
const MEDIUM_RISK_KEYWORDS = [
  // Customer interaction with risk exposure
  'customer onboarding', 'onboarding process', 'customer verification',
  'verify identity', 'identity verification', 'id verification',
  'collect documents', 'document verification', 'kyc', 'customer due diligence', 'cdd',
  // Transaction handling
  'process transaction', 'handle transaction', 'transaction monitoring',
  'monitor transaction', 'review alert', 'alert review',
  // Record keeping
  'update customer record', 'maintain records', 'customer file',
  'periodic review', 'customer review', 'ongoing monitoring',
  // Fraud exposure
  'fraud detection', 'fraud prevention', 'red flag',
  'identify suspicious', 'detect suspicious'
];

// Keywords that indicate specific risk categories
const RISK_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'AML': ['aml', 'anti-money laundering', 'money laundering', 'ml', 'terrorist financing', 'tf', 'cft'],
  'KYC': ['kyc', 'know your customer', 'customer identification', 'customer verification', 'cdd', 'customer due diligence', 'edd', 'enhanced due diligence'],
  'sanctions': ['sanctions', 'ofac', 'pep', 'politically exposed', 'designated person', 'asset freeze'],
  'fraud': ['fraud', 'suspicious activity', 'red flag', 'scam', 'deception'],
  'documentation': ['documentation', 'record keeping', 'record-keeping', 'audit trail', 'evidence', 'file maintenance'],
  'data_protection': ['data protection', 'gdpr', 'privacy', 'personal data', 'confidential', 'data security'],
  'governance': ['governance', 'policy', 'compliance', 'oversight', 'internal control', 'risk management']
};

/**
 * Check if text contains any of the given keywords
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Extract risk categories from text based on keywords
 */
function extractRiskCategoriesFromText(text: string): RiskCategory[] {
  const categories: RiskCategory[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(RISK_CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      categories.push(category as RiskCategory);
    }
  }
  
  return categories;
}

/**
 * Determine the maximum risk level from task risk hints
 */
function getMaxRiskFromTasks(tasks: ParsedTask[]): 'low' | 'medium' | 'high' {
  let maxRisk: 'low' | 'medium' | 'high' = 'low';
  
  for (const task of tasks) {
    for (const hint of task.riskHints) {
      if (hint.level === 'high') {
        return 'high';
      }
      if (hint.level === 'medium') {
        maxRisk = 'medium';
      }
    }
  }
  
  return maxRisk;
}

/**
 * Normalize the overall risk level based on keyword analysis
 */
function normalizeOverallRiskLevel(parsed: ParsedJobDescription): 'low' | 'medium' | 'high' {
  const fullText = JSON.stringify(parsed).toLowerCase();
  
  // Check for high-risk indicators
  const hasHighRiskKeywords = containsKeywords(fullText, HIGH_RISK_KEYWORDS);
  
  // Check for medium-risk indicators
  const hasMediumRiskKeywords = containsKeywords(fullText, MEDIUM_RISK_KEYWORDS);
  
  // Get max risk from task-level hints
  const maxTaskRisk = getMaxRiskFromTasks(parsed.tasks);
  
  // Rule 1: If high-risk keywords present, overall must be at least medium
  if (hasHighRiskKeywords && parsed.overallRiskLevel === 'low') {
    return 'medium';
  }
  
  // Rule 2: If medium-risk keywords present but overall is low, bump to medium
  if (hasMediumRiskKeywords && parsed.overallRiskLevel === 'low') {
    return 'medium';
  }
  
  // Rule 3: If task-level risks indicate high but overall is not high, align
  if (maxTaskRisk === 'high' && parsed.overallRiskLevel !== 'high') {
    return 'high';
  }
  
  // Rule 4: If overall is high but no task has high risk hint, add a flag
  // (This will be handled by the validator, not the normalizer)
  
  return parsed.overallRiskLevel;
}

/**
 * Ensure risk categories are populated based on task analysis
 */
function normalizeRiskCategories(parsed: ParsedJobDescription): RiskCategory[] {
  const categories = new Set<RiskCategory>(parsed.riskCategories);
  
  // Extract categories from all task descriptions and evidence text
  for (const task of parsed.tasks) {
    const taskText = `${task.description} ${task.evidenceText}`;
    const extractedCategories = extractRiskCategoriesFromText(taskText);
    extractedCategories.forEach(cat => categories.add(cat));
  }
  
  // Ensure at least one category
  if (categories.size === 0) {
    categories.add('governance');
  }
  
  return Array.from(categories);
}

/**
 * Ensure each task has appropriate risk hints based on its function type
 */
function normalizeTaskRiskHints(tasks: ParsedTask[]): ParsedTask[] {
  return tasks.map(task => {
    const hints = [...task.riskHints];
    
    // Add risk hints based on function type if missing
    if (task.functionType === 'customer_onboarding' || task.functionType === 'kyc_due_diligence') {
      if (!hints.some(h => h.category === 'KYC')) {
        hints.push({
          category: 'KYC',
          level: 'medium',
          reason: `Task involves ${task.functionType.replace(/_/g, ' ')} activities`
        });
      }
    }
    
    if (task.functionType === 'transaction_monitoring' || task.functionType === 'investigation') {
      if (!hints.some(h => h.category === 'AML')) {
        hints.push({
          category: 'AML',
          level: 'medium',
          reason: `Task involves ${task.functionType.replace(/_/g, ' ')} activities`
        });
      }
    }
    
    if (task.functionType === 'reporting' || task.functionType === 'escalation') {
      if (!hints.some(h => h.category === 'documentation')) {
        hints.push({
          category: 'documentation',
          level: 'low',
          reason: `Task involves ${task.functionType.replace(/_/g, ' ')} which requires proper documentation`
        });
      }
    }
    
    // Ensure at least one hint
    if (hints.length === 0) {
      hints.push({
        category: 'governance',
        level: 'low',
        reason: 'General operational risk'
      });
    }
    
    return { ...task, riskHints: hints };
  });
}

/**
 * Main normalization function
 * Applies all normalization rules and returns an enhanced parsed JD
 */
export function normalizeRiskProfile(parsed: ParsedJobDescription): ParsedJobDescription {
  // Normalize tasks first
  const normalizedTasks = normalizeTaskRiskHints(parsed.tasks);
  
  // Normalize overall risk level
  const normalizedRiskLevel = normalizeOverallRiskLevel({
    ...parsed,
    tasks: normalizedTasks
  });
  
  // Normalize risk categories
  const normalizedCategories = normalizeRiskCategories({
    ...parsed,
    tasks: normalizedTasks
  });
  
  return {
    ...parsed,
    tasks: normalizedTasks,
    overallRiskLevel: normalizedRiskLevel,
    riskCategories: normalizedCategories
  };
}

/**
 * Check if the parsed JD needs human review based on various factors
 */
export function needsHumanReview(parsed: ParsedJobDescription): boolean {
  // Low confidence
  if (parsed.confidence < 0.6) return true;
  
  // Has ambiguity flags
  if (parsed.ambiguityFlags.length > 0) return true;
  
  // No tasks extracted
  if (parsed.tasks.length === 0) return true;
  
  // Risk level mismatch (high overall but no high task risks)
  if (parsed.overallRiskLevel === 'high') {
    const hasHighTaskRisk = parsed.tasks.some(t => 
      t.riskHints.some(h => h.level === 'high')
    );
    if (!hasHighTaskRisk) return true;
  }
  
  return false;
}