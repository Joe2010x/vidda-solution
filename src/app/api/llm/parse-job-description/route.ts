import { NextRequest, NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm/client';
import { parseJSONFromLLM } from '@/lib/llm/parseJson';

/**
 * System prompt for parsing raw job descriptions into structured role data
 */
const PARSE_JOB_DESCRIPTION_SYSTEM_PROMPT = `You are an expert HR analyst and AML compliance specialist. 
Your task is to analyze raw job description text and extract structured information about the role.

You will be provided with:
- A raw job description text (may be unstructured, in various formats)

Your goal is to:
1. Extract the job title/role name
2. Identify the department or functional area
3. Extract key tasks and responsibilities as a list
4. Assess the AML/CFT risk level (low, medium, high) based on the responsibilities
5. Provide a concise description of the role

Consider these guidelines for risk assessment:
- HIGH risk: Roles involving financial transactions, client onboarding, compliance decisions, senior management, handling large sums
- MEDIUM risk: Roles with some exposure to financial processes, customer interaction, or operational oversight
- LOW risk: Roles with minimal financial exposure, no client interaction, or purely administrative/support functions

Format your response as JSON with the following structure:
{
  "name": "Job Title",
  "department": "Department Name",
  "description": "Concise 1-2 sentence description of the role",
  "tasks": ["Task 1", "Task 2", "Task 3", ...],
  "riskLevel": "low" | "medium" | "high"
}`;

/**
 * User prompt template for parsing job descriptions
 */
function createParseJobDescriptionPrompt(jobDescription: string): string {
  return `Analyze the following job description and extract structured information:

JOB DESCRIPTION:
${jobDescription}

Please extract:
1. Job title/role name
2. Department or functional area
3. Key tasks and responsibilities (as a list of specific tasks)
4. AML/CFT risk level assessment (low, medium, or high)
5. A concise description of the role

Format your response as valid JSON with this exact structure:
{
  "name": "string",
  "department": "string", 
  "description": "string",
  "tasks": ["string", "string", ...],
  "riskLevel": "low" | "medium" | "high"
}

Ensure the tasks are specific, actionable items (not just responsibilities). Extract at least 3-5 key tasks if possible.`;
}

/**
 * Parsed role data structure from job description
 */
interface ParsedRoleData {
  name: string;
  department?: string;
  description?: string;
  tasks: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

/**
 * Parse JSON response from LLM with error handling
 */
function parseLLMResponse(response: string): ParsedRoleData | null {
  return parseJSONFromLLM<ParsedRoleData | null>(response, null);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Job description text is required' },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: 'Job description is too short. Please provide more details.' },
        { status: 400 }
      );
    }

    const client = getLLMClient();
    
    const response = await client.chat([
      {
        role: 'system',
        content: PARSE_JOB_DESCRIPTION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: createParseJobDescriptionPrompt(jobDescription),
      },
    ]);

    const parsedRole = parseLLMResponse(response.choices[0]?.message.content || '');

    if (!parsedRole) {
      return NextResponse.json(
        { error: 'Failed to parse job description. Please try again or provide more structured information.' },
        { status: 500 }
      );
    }

    // Validate the parsed role has required fields
    if (!parsedRole.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 500 }
      );
    }
    if (!parsedRole.tasks || !Array.isArray(parsedRole.tasks) || parsedRole.tasks.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract tasks from job description' },
        { status: 500 }
      );
    }

    // Set defaults for optional fields
    const riskLevel = parsedRole.riskLevel || 'medium';
    const result = {
      name: parsedRole.name,
      department: parsedRole.department || 'General',
      description: parsedRole.description || 'Custom role created from job description',
      tasks: parsedRole.tasks,
      riskLevel: ['low', 'medium', 'high'].includes(riskLevel) 
        ? riskLevel 
        : 'medium',
    };

    return NextResponse.json({
      success: true,
      role: result,
    });

  } catch (error) {
    console.error('Error parsing job description:', error);
    
    // Check if it's a rate limit or API error
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        { error: 'LLM service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while parsing the job description.' },
      { status: 500 }
    );
  }
}