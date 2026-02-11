import { openAIService } from './openai.service';
import { logger } from '../utils/logger';

/** Structured output for daily summary */
export interface DailySummaryOutput {
  shortSummary: string;
  discussionTopics: string[];
  mostActiveChannels: { channelId: string; messageCount: number }[];
  totalMessageCount: number;
}

/** Message format passed to the generator */
export interface SummaryMessage {
  content: string;
  username: string;
  channelId: string;
  createdAt: Date;
  isToxic?: boolean;
}

const SYSTEM_PROMPT = `You are a Discord server analyst. Given a list of chat messages from the last 24 hours, produce a JSON object with this exact structure:
{
  "shortSummary": "A 2-3 sentence overview of the server activity and mood.",
  "discussionTopics": ["Topic 1", "Topic 2", ...],
  "mostActiveChannels": [{"channelId": "id", "messageCount": number}, ...],
  "totalMessageCount": number
}

Rules:
- shortSummary: Concise, neutral tone. Summarize main themes and activity level.
- discussionTopics: 3-7 bullet-point topics. Be specific based on message content.
- mostActiveChannels: List channels sorted by message count descending. Include channelId and messageCount.
- totalMessageCount: Sum of all messages.
- Output ONLY valid JSON, no markdown.`;

function buildUserPrompt(messages: SummaryMessage[]): string {
  const byChannel = messages.reduce(
    (acc, m) => {
      acc[m.channelId] = (acc[m.channelId] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sampleSize = Math.min(100, messages.length);
  const sample = messages.slice(0, sampleSize).map(
    (m) => `[#${m.channelId}] @${m.username}: ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`
  );

  return `Here are the last ${messages.length} messages from a Discord server (last 24h).

Message count by channel:
${Object.entries(byChannel)
  .map(([ch, count]) => `- ${ch}: ${count}`)
  .join('\n')}

Sample of messages (first ${sampleSize}):
${sample.join('\n')}

Produce the JSON summary.`;
}

/**
 * Reusable function: generate daily summary from messages using OpenAI.
 * Returns structured output. Falls back to null if OpenAI is unavailable or fails.
 */
export async function generateDailySummary(messages: SummaryMessage[]): Promise<DailySummaryOutput | null> {
  if (messages.length === 0) {
    return {
      shortSummary: 'No messages in the last 24 hours.',
      discussionTopics: [],
      mostActiveChannels: [],
      totalMessageCount: 0,
    };
  }

  if (!openAIService.isAvailable()) {
    logger.debug('OpenAI not available, skipping AI summary');
    return null;
  }

  try {
    const userPrompt = buildUserPrompt(messages);
    const raw = await openAIService.chat({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    const parsed = openAIService.parseJsonResponse<DailySummaryOutput>(raw);

    // Normalize and validate
    const total = messages.length;
    const byChannel = messages.reduce(
      (acc, m) => {
        acc[m.channelId] = (acc[m.channelId] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const mostActive = Object.entries(byChannel)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([channelId, messageCount]) => ({ channelId, messageCount }));

    return {
      shortSummary: parsed.shortSummary ?? 'No summary generated.',
      discussionTopics: Array.isArray(parsed.discussionTopics) ? parsed.discussionTopics : [],
      mostActiveChannels: mostActive,
      totalMessageCount: total,
    };
  } catch (error) {
    logger.error('OpenAI summary generation failed:', error);
    return null;
  }
}
