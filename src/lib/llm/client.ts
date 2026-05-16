/**
 * OpenRouter API Client for LLM Integration
 * Provides a clean interface for communicating with Google Gemini models via OpenRouter
 */

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  id: string;
  model: string;
  choices: Array<{
    message: LLMMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

class OpenRouterClient {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2000;
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  async chat(messages: LLMMessage[], options?: Partial<LLMRequest>): Promise<LLMResponse> {
    const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://viddasolutions.com',
        'X-Title': 'Vidda Solutions - Compliance Training Generator',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.max_tokens ?? this.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<LLMResponse>;
  }

  /**
   * Send a simple prompt and get a response
   */
  async generateResponse(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: LLMMessage[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await this.chat(messages);
    return response.choices[0]?.message.content ?? '';
  }

  /**
   * Get the current model name
   */
  getModel(): string {
    return this.model;
  }
}

// Singleton instance factory
let clientInstance: OpenRouterClient | null = null;

export function getLLMClient(): OpenRouterClient {
  if (!clientInstance) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite';

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    clientInstance = new OpenRouterClient({
      apiKey,
      model,
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  return clientInstance;
}

// Export for direct instantiation if needed
export { OpenRouterClient };