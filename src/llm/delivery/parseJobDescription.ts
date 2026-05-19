import { parseJobDescriptionWithLLM } from '../extraction/jobDescriptionParser';
import { normalizeRiskProfile, needsHumanReview } from '../extraction/riskNormalizer';
import type { ParsedJobDescription, ParsedJobDescriptionResponse, JDQualityMetrics } from '@/types';

export interface ParseJobDescriptionRequest {
  jobDescription: string;
}

// Legacy response for backward compatibility
export interface ParseJobDescriptionResponseLegacy {
  success: boolean;
  role?: {
    name: string;
    department: string;
    description: string;
    tasks: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  error?: string;
}

// Enhanced response with full role-risk profile
export interface ParseJobDescriptionResponseEnhanced {
  success: boolean;
  parsedRole?: ParsedJobDescription;
  quality?: JDQualityMetrics;
  nextRecommendedAction?: 'map_role_to_risks' | 'request_clarification';
  error?: string;
}

// Combined response type (exports both)
export type ParseJobDescriptionResponse = ParseJobDescriptionResponseEnhanced;

function validateParsedDescription(parsed: ParsedJobDescription): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check required fields
  if (!parsed.roleName || parsed.roleName.trim().length === 0) {
    issues.push('Missing required field: roleName');
  }

  // Check tasks
  if (!parsed.tasks || parsed.tasks.length === 0) {
    issues.push('No tasks extracted from job description');
  }

  // Validate each task
  parsed.tasks.forEach((task, index) => {
    if (!task.description || task.description.trim().length === 0) {
      issues.push(`Task ${index + 1}: Missing description`);
    }
    if (!task.evidenceText || task.evidenceText.trim().length === 0) {
      issues.push(`Task ${index + 1}: Missing evidenceText - each task must have supporting text from the JD`);
    }
    if (task.riskHints.length === 0) {
      issues.push(`Task ${index + 1}: No risk hints identified`);
    }
  });

  // Check risk level consistency
  if (parsed.overallRiskLevel === 'high') {
    const hasHighTaskRisk = parsed.tasks.some(t => t.riskHints.some(h => h.level === 'high'));
    if (!hasHighTaskRisk) {
      issues.push('Overall risk level is "high" but no task has a high-level risk hint');
    }
  }

  // Check confidence
  if (parsed.confidence < 0.5) {
    issues.push(`Low confidence score (${parsed.confidence}) - parsing may be unreliable`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function buildQualityMetrics(parsed: ParsedJobDescription, validationIssues: string[]): JDQualityMetrics {
  const issues = [...validationIssues];
  
  // Add ambiguity-related issues
  parsed.ambiguityFlags.forEach(flag => {
    issues.push(`Ambiguity in ${flag.field}: ${flag.issue}`);
  });

  const needsHumanReviewFlag = needsHumanReview(parsed) || validationIssues.length > 0;

  return {
    confidence: parsed.confidence,
    needsHumanReview: needsHumanReviewFlag,
    issues
  };
}

export async function handleParseJobDescription(body: ParseJobDescriptionRequest): Promise<ParseJobDescriptionResponse> {
  const jobDescription = body?.jobDescription;

  if (!jobDescription || typeof jobDescription !== 'string') {
    return { 
      success: false, 
      error: 'Job description text is required' 
    };
  }

  if (jobDescription.trim().length < 20) {
    return { 
      success: false, 
      error: 'Job description is too short. Please provide more details (at least 20 characters).' };
  }

  // Parse with enhanced LLM parser
  let parsedRole = await parseJobDescriptionWithLLM(jobDescription);

  if (!parsedRole) {
    return {
      success: false,
      error: 'Failed to parse job description. Please try again or provide more structured information.',
    };
  }

  // Apply rule-based normalization
  parsedRole = normalizeRiskProfile(parsedRole);

  // Validate the parsed description
  const validation = validateParsedDescription(parsedRole);

  // Build quality metrics
  const quality = buildQualityMetrics(parsedRole, validation.issues);

  // Determine next action
  const nextRecommendedAction: 'map_role_to_risks' | 'request_clarification' = 
    parsedRole.needsClarification || quality.needsHumanReview
      ? 'request_clarification'
      : 'map_role_to_risks';

  // Even with issues, return the parsed role if we have basic required fields
  if (!parsedRole.roleName || parsedRole.tasks.length === 0) {
    return {
      success: false,
      error: 'Could not extract basic role information. Please provide a more detailed job description.',
    };
  }

  return {
    success: true,
    parsedRole,
    quality,
    nextRecommendedAction,
  };
}

// Legacy adapter for backward compatibility
export async function handleParseJobDescriptionLegacy(body: ParseJobDescriptionRequest): Promise<ParseJobDescriptionResponseLegacy> {
  const enhanced = await handleParseJobDescription(body);
  
  if (!enhanced.success || !enhanced.parsedRole) {
    return {
      success: false,
      error: enhanced.error || 'Unknown error',
    };
  }

  const parsed = enhanced.parsedRole;

  return {
    success: true,
    role: {
      name: parsed.roleName,
      department: parsed.department || 'General',
      description: parsed.roleSummary || 'Custom role created from job description',
      tasks: parsed.tasks.map(t => t.description),
      riskLevel: parsed.overallRiskLevel,
    },
  };
}
