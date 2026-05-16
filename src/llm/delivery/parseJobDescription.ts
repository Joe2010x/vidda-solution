import { parseJobDescriptionWithLLM } from '../extraction/jobDescriptionParser';

export interface ParseJobDescriptionRequest {
  jobDescription: string;
}

export interface ParseJobDescriptionResponse {
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

export async function handleParseJobDescription(body: ParseJobDescriptionRequest): Promise<ParseJobDescriptionResponse> {
  const jobDescription = body?.jobDescription;

  if (!jobDescription || typeof jobDescription !== 'string') {
    return { success: false, error: 'Job description text is required' };
  }

  if (jobDescription.trim().length < 20) {
    return { success: false, error: 'Job description is too short. Please provide more details.' };
  }

  const parsedRole = await parseJobDescriptionWithLLM(jobDescription);

  if (!parsedRole) {
    return {
      success: false,
      error: 'Failed to parse job description. Please try again or provide more structured information.',
    };
  }

  if (!parsedRole.name) {
    return { success: false, error: 'Missing required field: name' };
  }

  if (!parsedRole.tasks || !Array.isArray(parsedRole.tasks) || parsedRole.tasks.length === 0) {
    return { success: false, error: 'Could not extract tasks from job description' };
  }

  const riskLevel = parsedRole.riskLevel || 'medium';
  const normalizedRiskLevel: 'low' | 'medium' | 'high' = ['low', 'medium', 'high'].includes(riskLevel)
    ? (riskLevel as 'low' | 'medium' | 'high')
    : 'medium';

  return {
    success: true,
    role: {
      name: parsedRole.name,
      department: parsedRole.department || 'General',
      description: parsedRole.description || 'Custom role created from job description',
      tasks: parsedRole.tasks,
      riskLevel: normalizedRiskLevel,
    },
  };
}
