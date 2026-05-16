/**
 * LLM-powered risk analysis service
 * Enhances the rule-based risk extraction with AI-powered semantic understanding
 */

import { Role, AMLRRequirement } from '@/types';
import { getLLMClient, LLMMessage } from './client';
import { 
  RISK_ANALYSIS_SYSTEM_PROMPT, 
  createRiskAnalysisPrompt 
} from './prompts';
import { amirRequirements } from '@/data/amirRequirements';
import { parseJSONFromLLM } from './parseJson';

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
function getAvailableRiskCategories(): string[] {
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
export async function analyzeRisksWithLLM(
  role: Role
): Promise<EnhancedRiskExtraction> {
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
      .filter((risk) => risk.confidence >= 50) // Only include risks with reasonable confidence
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
    
    // Import the fallback function dynamically to avoid circular dependencies
    const { extractRiskCategories } = await import('../retrieval');
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

/**
 * Enhanced requirements retrieval using LLM analysis
 * Combines LLM-powered risk analysis with intelligent requirement matching
 */
export async function retrieveRequirementsWithLLM(
  role: Role
): Promise<{
  requirements: AMLRRequirement[];
  mappedRisks: string[];
  analysis: RiskAnalysisResult | null;
  fallbackUsed: boolean;
}> {
  try {
    // First, analyze risks with LLM
    const riskAnalysis = await analyzeRisksWithLLM(role);
    const { riskCategories, analysis } = riskAnalysis;

    // Score requirements based on LLM-identified risks
    const scoredRequirements = amirRequirements.map((req) => {
      // Calculate score based on LLM confidence levels
      let score = 0;
      const matchingRisks = analysis.identifiedRisks.filter((risk) =>
        req.riskCategories.includes(risk.category)
      );
      
      matchingRisks.forEach((risk) => {
        // Weight by confidence (0-100) and normalize to 0-10 scale
        score += risk.confidence / 10;
      });

      // Add bonus for high-risk roles
      if (role.riskLevel === 'high' && req.riskCategories.includes('governance')) {
        score += 3;
      }

      return { requirement: req, score };
    });

    // Filter and sort requirements
    const matchedRequirements = scoredRequirements
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ requirement }) => requirement);

    return {
      requirements: matchedRequirements,
      mappedRisks: riskCategories,
      analysis: analysis,
      fallbackUsed: false,
    };
  } catch (error) {
    console.error('LLM requirements retrieval failed, using fallback:', error);
    
    // Use the original rule-based retrieval
    const { retrieveRequirements } = await import('../retrieval');
    const fallbackResult = retrieveRequirements(role);
    
    return {
      requirements: fallbackResult.requirements,
      mappedRisks: fallbackResult.mappedRisks,
      analysis: null,
      fallbackUsed: true,
    };
  }
}

/**
 * Get detailed risk analysis explanation for UI display
 */
export function formatRiskAnalysisForDisplay(analysis: RiskAnalysisResult): string {
  if (!analysis.identifiedRisks.length) {
    return 'No risk analysis available';
  }

  let output = `**Overall Assessment:** ${analysis.overallRiskAssessment}\n\n`;
  output += `**Identified Risk Categories:**\n`;
  
  analysis.identifiedRisks
    .sort((a, b) => b.confidence - a.confidence)
    .forEach((risk, index) => {
      output += `${index + 1}. **${risk.category}** (Confidence: ${risk.confidence}%)\n`;
      output += `   Related tasks: ${risk.relatedTasks.join(', ')}\n`;
      output += `   Reasoning: ${risk.reasoning}\n\n`;
    });

  if (analysis.additionalRisks.length > 0) {
    output += `**Additional Risks to Consider:**\n`;
    analysis.additionalRisks.forEach((risk) => {
      output += `- ${risk}\n`;
    });
  }

  return output;
}