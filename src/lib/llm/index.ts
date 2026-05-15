/**
 * LLM Module - AI-Powered Compliance Training Enhancement
 * 
 * This module integrates Google Gemini LLM via OpenRouter to enhance
 * the compliance training plan generation system with AI-powered analysis.
 * 
 * Key Features:
 * - Intelligent risk category extraction from role descriptions
 * - Semantic matching of regulatory requirements
 * - Optimized training plan generation with learning objectives
 * - Comprehensive validation with qualitative analysis
 * - AI-assisted human review process
 * 
 * Usage:
 * 
 * // Server-side (Node.js):
 * import { analyzeRisksWithLLM, generateTrainingPlanWithLLM, comprehensiveValidation } from '@/lib/llm';
 * 
 * // Client-side (via API routes):
 * const response = await fetch('/api/llm/analyze-risk', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ role })
 * });
 */

// Client and configuration
export { getLLMClient, OpenRouterClient } from './client';
export type { LLMMessage, LLMRequest, LLMResponse, LLMConfig } from './client';

// Prompt templates
export {
  RISK_ANALYSIS_SYSTEM_PROMPT,
  TRAINING_PLAN_SYSTEM_PROMPT,
  VALIDATION_SYSTEM_PROMPT,
  REVIEW_ASSISTANT_SYSTEM_PROMPT,
  createRiskAnalysisPrompt,
  createTrainingPlanPrompt,
  createValidationPrompt,
  createReviewCommentPrompt,
} from './prompts';

// Risk analysis
export {
  analyzeRisksWithLLM,
  retrieveRequirementsWithLLM,
  formatRiskAnalysisForDisplay,
} from './riskAnalyzer';
export type { RiskAnalysisResult, EnhancedRiskExtraction } from './riskAnalyzer';

// Training plan generation
export {
  generateTrainingPlanWithLLM,
  enhanceTrainingPlanWithLLM,
  formatLLMPlanAnalysisForDisplay,
} from './planGenerator';
export type {
  LLMSelectedModule,
  LLMTrainingPlan,
  EnhancedTrainingPlan,
} from './planGenerator';

// Validation and review
export {
  validateWithLLM,
  generateReviewAssessment,
  comprehensiveValidation,
  formatLLMValidationForDisplay,
  formatReviewAssessmentForDisplay,
} from './validator';
export type {
  LLMValidationAnalysis,
  EnhancedValidationResult,
  ReviewAssessment,
} from './validator';

// Caching
export { getLLMCache, CACHE_KEYS } from './cache';
export { LLMCache } from './cache';

/**
 * Configuration and environment setup
 * 
 * Required environment variables:
 * - OPENROUTER_API_KEY: Your OpenRouter API key
 * - OPENROUTER_MODEL: The model to use (default: google/gemini-2.0-flash-lite)
 * 
 * Optional environment variables:
 * - NEXT_PUBLIC_APP_NAME: Application name for API headers
 * - NEXT_PUBLIC_APP_VERSION: Application version for API headers
 */

/**
 * Error handling and fallback strategies
 * 
 * All LLM functions implement robust error handling:
 * 1. Primary: Use LLM for enhanced analysis
 * 2. Fallback: Use rule-based algorithms if LLM fails
 * 3. Graceful degradation: Always return usable results
 * 
 * The `fallbackUsed` flag in responses indicates when fallback was triggered.
 */

/**
 * Performance considerations
 * 
 * - LLM calls are cached to reduce API usage and improve response times
 * - Cache TTL is 5 minutes by default
 * - Fallback mechanisms ensure system remains responsive even if LLM is unavailable
 * - API routes handle server-side processing to protect API keys
 */

/**
 * Cost optimization
 * 
 * - Use caching to minimize redundant API calls
 * - Entry-level Gemini model provides good balance of cost and capability
 * - Consider implementing usage quotas for production environments
 * - Monitor token usage through OpenRouter dashboard
 */