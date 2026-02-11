import OpenAI from 'openai';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (config.openaiApiKey) {
      this.client = new OpenAI({ apiKey: config.openaiApiKey });
    } else {
      logger.warn('OPENAI_API_KEY not set; AI features will be disabled');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Create a chat completion with JSON response format.
   */
  async chat(options: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
  }): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not configured. Set OPENAI_API_KEY.');
    }

    const { systemPrompt, userPrompt, model = 'gpt-4o-mini' } = options;

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
  }

  /**
   * Parse JSON from chat response, with fallback for markdown-wrapped JSON.
   */
  parseJsonResponse<T>(raw: string): T {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned) as T;
  }
}

export const openAIService = new OpenAIService();
