import { getLLMClient, type LLMMessage } from '../preparation/client';
import { parseJSONFromLLM } from '../preparation/parseJson';
import {
  PARSE_JOB_DESCRIPTION_SYSTEM_PROMPT,
  createParseJobDescriptionPrompt,
} from './prompts';
import type { ParsedJobDescription, ParsedTask, RiskHint, AmbiguityFlag, FunctionType, RiskCategory } from '@/types';

// Legacy interface for backward compatibility
export interface ParsedRoleData {
  name: string;
  department?: string;
  description?: string;
  tasks: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

// Raw response from LLM before validation
interface RawLLMResponse {
  roleName?: string;
  name?: string; // Support both roleName and name for flexibility
  department?: string;
  seniority?: string;
  managementResponsibility?: boolean | string;
  roleSummary?: string;
  tasks?: RawTask[];
  overallRiskLevel?: string;
  riskCategories?: string[];
  ambiguityFlags?: RawAmbiguityFlag[];
  confidence?: number;
  needsClarification?: boolean;
  clarifyingQuestions?: string[];
}

interface RawTask {
  taskId?: string;
  description?: string;
  evidenceText?: string;
  riskHints?: RawRiskHint[];
  functionType?: string;
}

interface RawRiskHint {
  category?: string;
  level?: string;
  reason?: string;
}

interface RawAmbiguityFlag {
  field?: string;
  issue?: string;
  suggestedQuestion?: string;
}

// Valid values for enums
const VALID_SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'manager', 'executive', 'unknown'] as const;
const VALID_FUNCTION_TYPES = ['customer_onboarding', 'transaction_monitoring', 'kyc_due_diligence', 'investigation', 'escalation', 'reporting', 'governance', 'data_handling', 'training_oversight', 'other'] as const;
const VALID_RISK_CATEGORIES = ['AML', 'KYC', 'sanctions', 'fraud', 'documentation', 'data_protection', 'governance'] as const;
const VALID_RISK_LEVELS = ['low', 'medium', 'high'] as const;

function sanitizeSeniority(level: string | undefined): 'junior' | 'mid' | 'senior' | 'manager' | 'executive' | 'unknown' {
  if (!level) return 'unknown';
  const normalized = level.toLowerCase().trim();
  if (VALID_SENIORITY_LEVELS.includes(normalized as any)) {
    return normalized as any;
  }
  // Map common alternatives
  if (normalized.includes('entry') || normalized.includes('associate')) return 'junior';
  if (normalized.includes('mid') || normalized.includes('intermediate')) return 'mid';
  if (normalized.includes('senior') || normalized.includes('sr')) return 'senior';
  if (normalized.includes('manager') || normalized.includes('lead')) return 'manager';
  if (normalized.includes('exec') || normalized.includes('chief') || normalized.includes('head')) return 'executive';
  return 'unknown';
}

function sanitizeFunctionType(type: string | undefined): FunctionType {
  if (!type) return 'other';
  const normalized = type.toLowerCase().trim().replace(/[^a-z_]/g, '_');
  if (VALID_FUNCTION_TYPES.includes(normalized as any)) {
    return normalized as FunctionType;
  }
  // Map common alternatives
  if (normalized.includes('onboard')) return 'customer_onboarding';
  if (normalized.includes('monitor') || normalized.includes('surveillance')) return 'transaction_monitoring';
  if (normalized.includes('kyc') || normalized.includes('due_diligence') || normalized.includes('cdd')) return 'kyc_due_diligence';
  if (normalized.includes('investigat')) return 'investigation';
  if (normalized.includes('escalat')) return 'escalation';
  if (normalized.includes('report')) return 'reporting';
  if (normalized.includes('govern') || normalized.includes('policy')) return 'governance';
  if (normalized.includes('data') || normalized.includes('record')) return 'data_handling';
  if (normalized.includes('train')) return 'training_oversight';
  return 'other';
}

function sanitizeRiskCategory(category: string | undefined): RiskCategory | null {
  if (!category) return null;
  const normalized = category.toLowerCase().trim();
  if (VALID_RISK_CATEGORIES.includes(normalized as any)) {
    return normalized as RiskCategory;
  }
  // Map common alternatives
  if (normalized.includes('aml') || normalized.includes('money laundering')) return 'AML';
  if (normalized.includes('kyc') || normalized.includes('customer due diligence') || normalized.includes('cdd')) return 'KYC';
  if (normalized.includes('sanction')) return 'sanctions';
  if (normalized.includes('fraud')) return 'fraud';
  if (normalized.includes('document') || normalized.includes('record')) return 'documentation';
  if (normalized.includes('data') || normalized.includes('privacy') || normalized.includes('gdpr')) return 'data_protection';
  if (normalized.includes('govern') || normalized.includes('oversight')) return 'governance';
  return null;
}

function sanitizeRiskLevel(level: string | undefined): 'low' | 'medium' | 'high' {
  if (!level) return 'medium';
  const normalized = level.toLowerCase().trim();
  if (VALID_RISK_LEVELS.includes(normalized as any)) {
    return normalized as any;
  }
  return 'medium';
}

function validateAndTransformTask(rawTask: RawTask, index: number): ParsedTask | null {
  const description = rawTask.description;
  const evidenceText = rawTask.evidenceText || rawTask.description || '';
  
  if (!description) {
    return null;
  }

  const riskHints: RiskHint[] = [];
  if (rawTask.riskHints && Array.isArray(rawTask.riskHints)) {
    for (const rawHint of rawTask.riskHints) {
      const category = sanitizeRiskCategory(rawHint.category);
      if (category) {
        riskHints.push({
          category,
          level: sanitizeRiskLevel(rawHint.level),
          reason: rawHint.reason || 'Risk identified based on task analysis'
        });
      }
    }
  }

  // Ensure at least one risk hint (default to low governance risk if none identified)
  if (riskHints.length === 0) {
    riskHints.push({
      category: 'governance',
      level: 'low',
      reason: 'General operational risk associated with the role'
    });
  }

  return {
    taskId: rawTask.taskId || `task-${index + 1}`,
    description,
    evidenceText,
    riskHints,
    functionType: sanitizeFunctionType(rawTask.functionType)
  };
}

function validateAndTransformAmbiguityFlag(rawFlag: RawAmbiguityFlag): AmbiguityFlag | null {
  if (!rawFlag.field || !rawFlag.issue) {
    return null;
  }
  return {
    field: rawFlag.field,
    issue: rawFlag.issue,
    suggestedQuestion: rawFlag.suggestedQuestion || 'Please clarify this aspect of the role.'
  };
}

function parseLLMResponse(response: string): ParsedJobDescription | null {
  const raw = parseJSONFromLLM<RawLLMResponse | null>(response, null);
  
  if (!raw) {
    return null;
  }

  // Support both 'roleName' and 'name' for flexibility
  const roleName = raw.roleName || raw.name;
  if (!roleName) {
    return null;
  }

  // Process tasks
  const tasks: ParsedTask[] = [];
  if (raw.tasks && Array.isArray(raw.tasks)) {
    raw.tasks.forEach((rawTask, index) => {
      const task = validateAndTransformTask(rawTask, index);
      if (task) {
        tasks.push(task);
      }
    });
  }

  // If no tasks extracted, try to extract from legacy format
  if (tasks.length === 0 && raw.roleSummary) {
    tasks.push({
      taskId: 'task-1',
      description: raw.roleSummary,
      evidenceText: raw.roleSummary,
      riskHints: [{ category: 'governance', level: 'low', reason: 'General role risk' }],
      functionType: 'other'
    });
  }

  // Process ambiguity flags
  const ambiguityFlags: AmbiguityFlag[] = [];
  if (raw.ambiguityFlags && Array.isArray(raw.ambiguityFlags)) {
    raw.ambiguityFlags.forEach((rawFlag) => {
      const flag = validateAndTransformAmbiguityFlag(rawFlag);
      if (flag) {
        ambiguityFlags.push(flag);
      }
    });
  }

  // Process risk categories
  const riskCategories: RiskCategory[] = [];
  if (raw.riskCategories && Array.isArray(raw.riskCategories)) {
    raw.riskCategories.forEach((cat) => {
      const sanitized = sanitizeRiskCategory(cat);
      if (sanitized && !riskCategories.includes(sanitized)) {
        riskCategories.push(sanitized);
      }
    });
  }

  // If no risk categories specified, infer from task risk hints
  if (riskCategories.length === 0) {
    tasks.forEach(task => {
      task.riskHints.forEach(hint => {
        if (!riskCategories.includes(hint.category)) {
          riskCategories.push(hint.category);
        }
      });
    });
  }

  const overallRiskLevel = sanitizeRiskLevel(raw.overallRiskLevel);
  const confidence = typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.7;
  const needsClarification = raw.needsClarification === true || ambiguityFlags.length > 0;

  return {
    roleName,
    department: raw.department,
    seniority: sanitizeSeniority(raw.seniority),
    managementResponsibility: raw.managementResponsibility === true ? true : raw.managementResponsibility === false ? false : 'unknown',
    roleSummary: raw.roleSummary || `Role: ${roleName}`,
    tasks,
    overallRiskLevel,
    riskCategories,
    ambiguityFlags,
    confidence,
    needsClarification,
    clarifyingQuestions: raw.clarifyingQuestions || (needsClarification ? ambiguityFlags.map(f => f.suggestedQuestion) : [])
  };
}

export async function parseJobDescriptionWithLLM(jobDescription: string): Promise<ParsedJobDescription | null> {
  const client = getLLMClient();

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: PARSE_JOB_DESCRIPTION_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: createParseJobDescriptionPrompt(jobDescription),
    },
  ];

  const response = await client.chat(messages, { max_tokens: 10000 });
  return parseLLMResponse(response.choices[0]?.message.content || '');
}

// Legacy function for backward compatibility
async function parseJobDescriptionLegacy(jobDescription: string): Promise<ParsedRoleData | null> {
  const enhanced = await parseJobDescriptionWithLLM(jobDescription);
  if (!enhanced) {
    return null;
  }

  return {
    name: enhanced.roleName,
    department: enhanced.department,
    description: enhanced.roleSummary,
    tasks: enhanced.tasks.map(t => t.description),
    riskLevel: enhanced.overallRiskLevel
  };
}

// Export both versions
export { parseJobDescriptionLegacy as parseJobDescriptionWithLLMLegacy };