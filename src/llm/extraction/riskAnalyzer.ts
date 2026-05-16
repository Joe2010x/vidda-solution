/**
 * LLM-powered risk analysis service
 * Enhances the rule-based risk extraction with AI-powered semantic understanding
 */

import { Role } from '@/types';
import { getLLMClient, type LLMMessage } from '../preparation/client';
import {
  RISK_ANALYSIS_SYSTEM_PROMPT,
  createRiskAnalysisPrompt,
} from './prompts';
import { amirRequirements } from '@/data/amirRequirements';
import { parseJSONFromLLM } from '../preparation/parseJson';

export interface RiskAnalysisResult {
  identifiedRisks: Array<{
    category: string;
    confidence: number;
    relatedTasks: string[];
    reasoning: string;
  }>;
  additionalRisks: string[];
  overallRiskAssessment: string;
}

export interface EnhancedRiskExtraction {
  riskCategories: string[];
  analysis: RiskAnalysisResult;
  fallbackUsed: boolean;
}

/**
 * Get all available risk categories from the requirements
 */
export function getAvailableRiskCategories(): string[] {
  const categories = new Set<string>();
  amirRequirements.forEach((req) => {
    req.riskCategories.forEach((cat) => categories.add(cat));
  });
  return Array.from(categories);
}

/**
 * Analyze a role using LLM to identify risk categories
 * Falls back to rule-based extraction if LLM fails
 */
export async function analyzeRisksWithLLM(role: Role): Promise<EnhancedRiskExtraction> {
  const availableCategories = getAvailableRiskCategories();

  try {
    const client = getLLMClient();

    const systemMessage: LLMMessage = {
      role: 'system',
      content: RISK_ANALYSIS_SYSTEM_PROMPT,
    };

    const userMessage: LLMMessage = {
      role: 'user',
      content: createRiskAnalysisPrompt(role, availableCategories),
    };

    const response = await client.chat([systemMessage, userMessage]);
    const analysis = parseJSONFromLLM<RiskAnalysisResult>(
      response.choices[0]?.message.content || '',
      {
        identifiedRisks: [],
        additionalRisks: [],
        overallRiskAssessment: 'Analysis failed',
      }
    );

    // Extract risk categories from the analysis
    const riskCategories = analysis.identifiedRisks
      .filter((risk) => risk.confidence >= 50)
      .map((risk) => risk.category);

    // Add any additional risks that match known categories
    analysis.additionalRisks.forEach((risk) => {
      if (availableCategories.includes(risk) && !riskCategories.includes(risk)) {
        riskCategories.push(risk);
      }
    });

    return {
      riskCategories,
      analysis,
      fallbackUsed: false,
    };
  } catch (error) {
    console.error('LLM risk analysis failed, using fallback:', error);

    const { extractRiskCategories } = await import('../retrieval/ruleBased');
    const fallbackCategories = extractRiskCategories(role.tasks);

    return {
      riskCategories: fallbackCategories,
      analysis: {
        identifiedRisks: fallbackCategories.map((cat) => ({
          category: cat,
          confidence: 75,
          relatedTasks: role.tasks,
          reasoning: 'Extracted using rule-based fallback',
        })),
        additionalRisks: [],
        overallRiskAssessment: `Identified ${fallbackCategories.length} risk categories using rule-based analysis`,
      },
      fallbackUsed: true,
    };
  }
}
