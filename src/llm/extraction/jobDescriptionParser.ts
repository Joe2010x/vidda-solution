import { getLLMClient, type LLMMessage } from '../preparation/client';
import { parseJSONFromLLM } from '../preparation/parseJson';
import {
  PARSE_JOB_DESCRIPTION_SYSTEM_PROMPT,
  createParseJobDescriptionPrompt,
} from './prompts';

export interface ParsedRoleData {
  name: string;
  department?: string;
  description?: string;
  tasks: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

function parseLLMResponse(response: string): ParsedRoleData | null {
  return parseJSONFromLLM<ParsedRoleData | null>(response, null);
}

export async function parseJobDescriptionWithLLM(jobDescription: string): Promise<ParsedRoleData | null> {
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

  const response = await client.chat(messages);
  return parseLLMResponse(response.choices[0]?.message.content || '');
}
