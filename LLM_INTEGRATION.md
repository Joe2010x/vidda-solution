# LLM Integration Guide - Vidda Solutions

## Overview

This document describes the LLM (Large Language Model) integration in the Vidda Solutions compliance training generator. The system uses Google's Gemini model via OpenRouter to enhance the training plan generation process with AI-powered analysis.

## Architecture

### Components

This repo uses a staged execution model under `src/llm/`:

Preparation → Extraction → Retrieval → Generation → Post-processing → Validation → Delivery

Each stage exposes a **single public entrypoint** (`src/llm/<stage>/index.ts`) to reduce merge conflicts.

1. **Preparation** (`src/llm/preparation/*`)
  - OpenRouter client: `src/llm/preparation/client.ts`
  - Cache: `src/llm/preparation/cache.ts`
  - JSON parsing/repair: `src/llm/preparation/parseJson.ts`

2. **Extraction** (`src/llm/extraction/*`)
  - Risk analysis: `src/llm/extraction/riskAnalyzer.ts`
  - Job description parsing: `src/llm/extraction/jobDescriptionParser.ts`
  - Extraction prompts: `src/llm/extraction/prompts.ts`

3. **Retrieval** (`src/llm/retrieval/*`)
  - Rule-based retrieval: `src/llm/retrieval/ruleBased.ts`
  - LLM-enhanced requirements retrieval: `src/llm/retrieval/requirementsWithLLM.ts`

4. **Generation** (`src/llm/generation/*`)
  - Rule-based plan generation: `src/llm/generation/ruleBased.ts`
  - LLM plan generation: `src/llm/generation/planGenerator.ts`
  - Generation prompts: `src/llm/generation/prompts.ts`

5. **Post-processing** (`src/llm/post-processing/*`)
  - Display formatters: `src/llm/post-processing/formatters.ts`

6. **Validation** (`src/llm/validation/*`)
  - Rule-based validation scoring: `src/llm/validation/ruleBased.ts`
  - LLM validation + review assessment: `src/llm/validation/validator.ts`
  - Validation prompts: `src/llm/validation/prompts.ts`

7. **Delivery** (`src/llm/delivery/*`)
  - Server-side handlers consumed by Next.js API routes

### API Routes

- `/api/llm/analyze-risk` - Analyze role for risk categories
- `/api/llm/generate-plan` - Generate training plan with LLM
- `/api/llm/validate-plan` - Validate training plan with LLM
- `/api/llm/parse-job-description` - Parse raw job description text into structured role data

Note: route files remain under `src/app/api/**` (Next.js constraint), but the logic lives in `src/llm/delivery/*`.

## Setup

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-lite

# Application Configuration (optional)
NEXT_PUBLIC_APP_NAME="Vidda Solutions"
NEXT_PUBLIC_APP_VERSION="2.0.0-LLM"
```

### 2. Get OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account
3. Generate an API key
4. The key provides access to Google Gemini models

### 3. Model Selection

The default model is `google/gemini-2.0-flash-lite` (entry-level Gemini). You can change this in the `.env.local` file:

```env
OPENROUTER_MODEL=google/gemini-2.0-flash-lite
```

Other available models via OpenRouter:
- `google/gemini-pro` - Standard Gemini Pro
- `google/gemini-1.5-pro` - More capable but more expensive

## Usage

### Client-Side Usage (via API Routes)

```typescript
// Analyze risk categories
const response = await fetch('/api/llm/analyze-risk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role })
});
const result = await response.json();

// Generate training plan
const planResponse = await fetch('/api/llm/generate-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role, requirements, riskCategories })
});
const planResult = await response.json();

// Validate training plan
const validationResponse = await fetch('/api/llm/validate-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role, requirements, trainingPlan, riskCategories })
});
const validationResult = await response.json();

// Parse job description (NEW)
const parseResponse = await fetch('/api/llm/parse-job-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobDescription: 'Senior Analyst responsible for...' })
});
const parsedRole = await response.json();
```

### Server-Side Usage (Direct Import)

```typescript
import {
  analyzeRisksWithLLM,
  generateTrainingPlanWithLLM,
  comprehensiveValidation,
} from '@/llm';

// Analyze risks
const riskResult = await analyzeRisksWithLLM(role);
console.log(riskResult.riskCategories);
console.log(riskResult.analysis); // Detailed analysis with confidence scores

// Generate training plan
const planResult = await generateTrainingPlanWithLLM(
  role,
  requirements,
  riskCategories
);
console.log(planResult.plan); // TrainingPlan object
console.log(planResult.llmAnalysis); // LLM insights and recommendations

// Validate plan
const validationResult = await comprehensiveValidation(
  role,
  requirements,
  trainingPlan,
  riskCategories
);
console.log(validationResult.combinedScore); // ValidationScore
console.log(validationResult.llmAnalysis); // Detailed qualitative analysis
console.log(validationResult.reviewAssessment); // AI review recommendations
```

## Features

### 1. Intelligent Risk Analysis

The LLM analyzes role descriptions and tasks to identify relevant AML/CFT risk categories:

- **Semantic Understanding**: Goes beyond keyword matching to understand context
- **Confidence Scoring**: Each identified risk includes a confidence score (0-100)
- **Detailed Reasoning**: Provides explanations for why each risk is relevant
- **Additional Risks**: Can identify risks not in the predefined list

### 2. Optimized Training Plan Generation

The LLM creates optimized training plans:

- **Learning Objectives**: Generates specific objectives for each role
- **Optimal Sequencing**: Suggests the best order for completing modules
- **Priority Justification**: Explains why each module is important
- **Critical Path**: Identifies modules that must be completed first

### 3. Comprehensive Validation

The LLM provides qualitative validation:

- **Detailed Analysis**: Identifies strengths, weaknesses, and gaps
- **Actionable Recommendations**: Specific suggestions for improvement
- **Grade and Status**: Clear assessment (A-F grade, excellent-poor status)
- **Review Assessment**: AI-powered review comments for human reviewers

### 4. Fallback Mechanisms

The system gracefully handles LLM failures:

- **Automatic Fallback**: Switches to rule-based algorithms if LLM fails
- **Error Recovery**: Always returns usable results
- **Fallback Indicator**: `fallbackUsed` flag shows when fallback was triggered

### 5. Caching and Optimization

- **Response Caching**: Reduces API calls and improves performance
- **TTL Management**: Automatic cleanup of expired cache entries
- **Cost Optimization**: Minimizes redundant API requests

## Configuration

### Cache Configuration

The cache is configured with a default TTL of 5 minutes. To modify:

```typescript
import { LLMCache } from '@/lib/llm/cache';

const customCache = new LLMCache(10 * 60 * 1000); // 10 minutes TTL
```

### Temperature and Max Tokens

Modify the LLM client configuration in `src/lib/llm/client.ts`:

```typescript
clientInstance = new OpenRouterClient({
  apiKey,
  model,
  temperature: 0.7, // 0-1, higher = more creative
  maxTokens: 2000, // Maximum response length
});
```

## Error Handling

All LLM functions implement robust error handling:

```typescript
try {
  const result = await analyzeRisksWithLLM(role);
  if (result.fallbackUsed) {
    console.log('Using rule-based fallback');
  }
} catch (error) {
  console.error('LLM analysis failed:', error);
}
```

## Performance Considerations

### Response Times

- **LLM Calls**: Typically 2-5 seconds depending on complexity
- **Cached Responses**: < 100ms
- **Fallback**: < 100ms (rule-based)

### Cost Optimization

1. **Use Caching**: The system automatically caches responses
2. **Entry-Level Model**: Uses Gemini Flash Lite for cost efficiency
3. **Batch Operations**: Consider batching similar requests
4. **Monitor Usage**: Check OpenRouter dashboard for token usage

### Rate Limits

OpenRouter has rate limits based on your account tier. Monitor usage and implement appropriate delays if needed.

## Testing

### Unit Tests

Test the LLM integration with mock responses:

```typescript
import { analyzeRisksWithLLM } from '@/lib/llm';

// Mock the LLM client in tests
jest.mock('@/lib/llm/client', () => ({
  getLLMClient: () => ({
    chat: jest.fn().mockResolvedValue({
      choices: [{ message: { content: '{"identifiedRisks":[]}' } }]
    })
  })
}));
```

### Integration Tests

Test the full pipeline:

```typescript
describe('LLM Integration', () => {
  it('should analyze risks with LLM', async () => {
    const role = roles[0];
    const result = await analyzeRisksWithLLM(role);
    expect(result.riskCategories).toBeDefined();
    expect(result.riskCategories.length).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify your OpenRouter API key is correct
   - Check that the key has access to Google Gemini models

2. **Timeout Errors**
   - LLM calls can take 2-5 seconds
   - Consider increasing timeout for complex analyses

3. **JSON Parsing Errors**
   - LLM responses are parsed as JSON
   - If parsing fails, the system falls back to rule-based approach

4. **Rate Limit Errors**
   - Check your OpenRouter account limits
   - Implement exponential backoff for retries

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// In src/lib/llm/client.ts, add logging
console.log('LLM Request:', { model, messages });
console.log('LLM Response:', response);
```

## Best Practices

1. **Always Handle Fallbacks**: Check the `fallbackUsed` flag in responses
2. **Cache Appropriately**: Use caching for repeated analyses
3. **Monitor Costs**: Track token usage through OpenRouter dashboard
4. **Validate Responses**: Always validate LLM output before using
5. **Provide Context**: Include sufficient context in prompts for best results

## Future Enhancements

Potential improvements for the LLM integration:

1. **Multi-Model Support**: Switch between different LLM providers
2. **Streaming Responses**: Real-time response generation
3. **Fine-Tuning**: Custom models trained on compliance data
4. **Batch Processing**: Process multiple roles simultaneously
5. **Advanced Caching**: Redis or database-backed caching
6. **Usage Analytics**: Track and optimize LLM usage patterns

## Support

For issues or questions:

1. Check the [OpenRouter Documentation](https://openrouter.ai/docs)
2. Review the [Google Gemini API Documentation](https://ai.google.dev/docs)
3. Examine the source code in `src/lib/llm/`
4. Check the console logs for detailed error messages

## Custom Job Description Parsing (NEW Feature)

The system now supports parsing raw job description text into structured role data. This allows users to paste any job description and have the LLM extract:

- Job title and department
- Key tasks and responsibilities
- AML/CFT risk level assessment
- Role description

### Usage

```typescript
// Client-side usage
const response = await fetch('/api/llm/parse-job-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobDescription: `
      Senior Financial Analyst - Transaction Monitoring
      
      We are seeking an experienced analyst to join our team.
      Responsibilities include:
      - Monitor and analyze high-value financial transactions
      - Conduct enhanced due diligence on high-risk customers
      - Prepare Suspicious Activity Reports (SARs)
      - Collaborate with compliance officers on AML policies
    `
  })
});

const { success, role } = await response.json();
if (success) {
  console.log(role.name);        // "Senior Financial Analyst"
  console.log(role.department);  // "Finance"
  console.log(role.tasks);       // Array of extracted tasks
  console.log(role.riskLevel);   // "high"
}
```

The parsed role can then be used with the existing pipeline to generate a compliance training plan.

## License

This LLM integration follows the same license as the main Vidda Solutions project.
