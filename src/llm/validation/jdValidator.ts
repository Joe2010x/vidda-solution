/**
 * JD-specific validation rules
 * Validates ParsedJobDescription against strict rules to ensure quality and consistency
 */

import type { ParsedJobDescription, ParsedTask, RiskHint } from '@/types';

export interface JDValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: JDValidationIssue[];
  warnings: JDValidationIssue[];
  needsHumanReview: boolean;
}

export interface JDValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

// Scoring weights
const SCORING = {
  tasksPresent: 20,
  evidenceTextPresent: 15,
  riskHintsPresent: 15,
  riskConsistency: 15,
  confidenceScore: 10,
  noAmbiguity: 10,
  functionTypesAssigned: 10,
  riskCategoriesPresent: 5,
};

/**
 * Validate that each task has required fields
 */
function validateTasks(tasks: ParsedTask[]): JDValidationIssue[] {
  const issues: JDValidationIssue[] = [];

  if (!tasks || tasks.length === 0) {
    issues.push({
      severity: 'error',
      field: 'tasks',
      message: 'No tasks extracted from job description',
      suggestion: 'Provide a more detailed job description with specific responsibilities'
    });
    return issues;
  }

  tasks.forEach((task, index) => {
    const taskLabel = `tasks[${index}]`;

    // Check description
    if (!task.description || task.description.trim().length < 5) {
      issues.push({
        severity: 'error',
        field: taskLabel,
        message: `Task ${index + 1}: Description is missing or too short`,
        suggestion: 'Each task should have a clear, descriptive label'
      });
    }

    // Check evidence text
    if (!task.evidenceText || task.evidenceText.trim().length === 0) {
      issues.push({
        severity: 'error',
        field: `${taskLabel}.evidenceText`,
        message: `Task ${index + 1}: Missing evidenceText`,
        suggestion: 'Each task must include the exact quote from the JD that supports its extraction'
      });
    } else if (task.evidenceText === task.description) {
      issues.push({
        severity: 'warning',
        field: `${taskLabel}.evidenceText`,
        message: `Task ${index + 1}: Evidence text is identical to description`,
        suggestion: 'Evidence text should be the original JD text, description should be a cleaned-up version'
      });
    }

    // Check risk hints
    if (!task.riskHints || task.riskHints.length === 0) {
      issues.push({
        severity: 'error',
        field: `${taskLabel}.riskHints`,
        message: `Task ${index + 1}: No risk hints identified`,
        suggestion: 'Each task should have at least one risk hint explaining its AML/CFT relevance'
      });
    } else {
      task.riskHints.forEach((hint, hintIndex) => {
        if (!hint.reason || hint.reason.trim().length === 0) {
          issues.push({
            severity: 'warning',
            field: `${taskLabel}.riskHints[${hintIndex}].reason`,
            message: `Task ${index + 1}: Risk hint #${hintIndex + 1} missing reason`,
            suggestion: 'Explain why this risk category applies to the task'
          });
        }
      });
    }

    // Check function type
    if (!task.functionType || task.functionType === 'other') {
      issues.push({
        severity: 'warning',
        field: `${taskLabel}.functionType`,
        message: `Task ${index + 1}: Function type is "other"`,
        suggestion: 'Try to assign a more specific function type for better risk mapping'
      });
    }
  });

  return issues;
}

/**
 * Validate risk level consistency between overall and task-level risks
 */
function validateRiskConsistency(parsed: ParsedJobDescription): JDValidationIssue[] {
  const issues: JDValidationIssue[] = [];

  // Check if overall risk level is justified by task-level risks
  const hasHighTaskRisk = parsed.tasks.some(t => 
    t.riskHints.some(h => h.level === 'high')
  );
  const hasMediumTaskRisk = parsed.tasks.some(t => 
    t.riskHints.some(h => h.level === 'medium')
  );

  if (parsed.overallRiskLevel === 'high' && !hasHighTaskRisk) {
    issues.push({
      severity: 'error',
      field: 'overallRiskLevel',
      message: 'Overall risk level is "high" but no task has a high-level risk hint',
      suggestion: 'Either add high-level risk hints to relevant tasks or lower the overall risk level'
    });
  }

  if (parsed.overallRiskLevel === 'medium' && !hasHighTaskRisk && !hasMediumTaskRisk) {
    issues.push({
      severity: 'warning',
      field: 'overallRiskLevel',
      message: 'Overall risk level is "medium" but no task has medium or high risk hints',
      suggestion: 'Review task risk hints or adjust overall risk level'
    });
  }

  if (parsed.overallRiskLevel === 'low' && hasMediumTaskRisk) {
    issues.push({
      severity: 'warning',
      field: 'overallRiskLevel',
      message: 'Overall risk level is "low" but some tasks have medium risk hints',
      suggestion: 'Consider raising overall risk level to "medium"'
    });
  }

  // Check risk categories
  if (!parsed.riskCategories || parsed.riskCategories.length === 0) {
    issues.push({
      severity: 'warning',
      field: 'riskCategories',
      message: 'No risk categories identified',
      suggestion: 'Risk categories should be inferred from task risk hints'
    });
  }

  return issues;
}

/**
 * Validate ambiguity flags
 */
function validateAmbiguity(parsed: ParsedJobDescription): JDValidationIssue[] {
  const issues: JDValidationIssue[] = [];

  if (parsed.ambiguityFlags.length > 0) {
    parsed.ambiguityFlags.forEach((flag, index) => {
      issues.push({
        severity: 'warning',
        field: `ambiguityFlags[${index}].${flag.field}`,
        message: flag.issue,
        suggestion: flag.suggestedQuestion
      });
    });
  }

  return issues;
}

/**
 * Calculate validation score based on various factors
 */
function calculateValidationScore(parsed: ParsedJobDescription, issues: JDValidationIssue[]): number {
  let score = 100;
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  // Deduct for errors
  score -= errors.length * 15;

  // Deduct for warnings
  score -= warnings.length * 5;

  // Deduct for low confidence
  if (parsed.confidence < 0.7) {
    score -= (0.7 - parsed.confidence) * 30;
  }

  // Bonus for having many tasks
  if (parsed.tasks.length >= 5) {
    score += 5;
  }

  // Ensure score is within bounds
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Main validation function for ParsedJobDescription
 */
export function validateParsedJobDescription(parsed: ParsedJobDescription): JDValidationResult {
  const allIssues: JDValidationIssue[] = [];

  // Run all validations
  allIssues.push(...validateTasks(parsed.tasks));
  allIssues.push(...validateRiskConsistency(parsed));
  allIssues.push(...validateAmbiguity(parsed));

  // Categorize issues
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');

  // Calculate score
  const score = calculateValidationScore(parsed, allIssues);

  // Determine if human review is needed
  const needsHumanReview = 
    errors.length > 0 || 
    parsed.confidence < 0.6 || 
    parsed.ambiguityFlags.length > 2 ||
    score < 70;

  return {
    isValid: errors.length === 0,
    score,
    issues: errors,
    warnings,
    needsHumanReview
  };
}

/**
 * Validate a single task
 */
export function validateTask(task: ParsedTask, index: number): JDValidationIssue[] {
  const issues: JDValidationIssue[] = [];
  const taskLabel = `tasks[${index}]`;

  if (!task.description || task.description.trim().length < 5) {
    issues.push({
      severity: 'error',
      field: `${taskLabel}.description`,
      message: 'Task description is missing or too short',
      suggestion: 'Provide a clear, descriptive label for the task'
    });
  }

  if (!task.evidenceText || task.evidenceText.trim().length === 0) {
    issues.push({
      severity: 'error',
      field: `${taskLabel}.evidenceText`,
      message: 'Evidence text is missing',
      suggestion: 'Include the exact quote from the JD that supports this task'
    });
  }

  if (!task.riskHints || task.riskHints.length === 0) {
    issues.push({
      severity: 'error',
      field: `${taskLabel}.riskHints`,
      message: 'No risk hints identified',
      suggestion: 'Identify at least one risk category relevant to this task'
    });
  }

  return issues;
}