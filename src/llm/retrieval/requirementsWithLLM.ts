import { Role, AMLRRequirement } from '@/types';
import { amlrRequirements } from '@/data/amlrRequirements';
import { analyzeRisksWithLLM, type RiskAnalysisResult } from '../extraction/riskAnalyzer';

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
    const scoredRequirements = amlrRequirements.map((req) => {
      // Calculate score based on LLM confidence levels
      let score = 0;
      const matchingRisks = analysis.identifiedRisks.filter((risk) => req.riskCategories.includes(risk.category));

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
    const { retrieveRequirementsRuleBased } = await import('./ruleBased');
    const fallbackResult = retrieveRequirementsRuleBased(role);

    return {
      requirements: fallbackResult.requirements,
      mappedRisks: fallbackResult.mappedRisks,
      analysis: null,
      fallbackUsed: true,
    };
  }
}
