import { prisma } from '../db/client';
import { logger } from '../utils/logger';
import { generateDailySummary, type DailySummaryOutput } from './summary-generator';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface DailySummaryData {
  shortSummary: string;
  topics: string[];
  mostActiveChannels: { channelId: string; messageCount: number }[];
  totalMessages: number;
  toxicUsersCount: number;
  toxicMessagesCount: number;
}

function formatStructuredSummary(serverId: string, data: DailySummaryOutput, toxicCount: number): string {
  const lines: string[] = [
    `**📊 Daily Summary** (Server: \`${serverId}\`)`,
    '',
    `**Chat summary**\n${data.shortSummary}`,
    '',
    '**Main discussion topics**',
    ...data.discussionTopics.map((t) => `• ${t}`),
    '',
    '**Most active channels**',
    ...data.mostActiveChannels.slice(0, 5).map((c) => `• \`${c.channelId}\`: ${c.messageCount} messages`),
    '',
    `**Total messages:** ${data.totalMessageCount}`,
    `**Toxic messages flagged:** ${toxicCount}`,
  ];
  return lines.join('\n');
}

function formatFallbackSummary(
  serverId: string,
  messageCount: number,
  uniqueUsers: number,
  channelCount: number,
  toxicCount: number
): string {
  return [
    `**📊 Daily Summary** (Server: \`${serverId}\`)`,
    '',
    '**Chat summary**\nNo AI summary (OpenAI unavailable or no messages).',
    '',
    `**Total messages:** ${messageCount}`,
    `**Unique users:** ${uniqueUsers}`,
    `**Active channels:** ${channelCount}`,
    `**Toxic messages flagged:** ${toxicCount}`,
  ].join('\n');
}

export class SummaryService {
  /**
   * Returns structured summary data for report formatting (with channel name resolution).
   */
  async getDailySummaryData(serverId: string): Promise<DailySummaryData | null> {
    const since = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

    const messages = await prisma.message.findMany({
      where: { serverId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        content: true,
        username: true,
        channelId: true,
        createdAt: true,
        isToxic: true,
      },
    });

    if (messages.length === 0) {
      return {
        shortSummary: 'No messages in the last 24 hours.',
        topics: [],
        mostActiveChannels: [],
        totalMessages: 0,
        toxicUsersCount: 0,
        toxicMessagesCount: 0,
      };
    }

    const toxicMessages = messages.filter((m) => m.isToxic);
    const toxicUsersCount = new Set(toxicMessages.map((m) => m.username)).size;
    const byChannel = messages.reduce(
      (acc, m) => {
        acc[m.channelId] = (acc[m.channelId] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const mostActiveChannels = Object.entries(byChannel)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([channelId, messageCount]) => ({ channelId, messageCount }));

    const structured = await generateDailySummary(
      messages.map((m) => ({
        content: m.content,
        username: m.username,
        channelId: m.channelId,
        createdAt: m.createdAt,
        isToxic: m.isToxic,
      }))
    );

    return {
      shortSummary: structured?.shortSummary ?? 'No AI summary available.',
      topics: structured?.discussionTopics ?? [],
      mostActiveChannels,
      totalMessages: messages.length,
      toxicUsersCount,
      toxicMessagesCount: toxicMessages.length,
    };
  }

  /**
   * Fetch messages from the last 24 hours and generate daily summary (legacy string format).
   */
  async generateDailySummary(serverId: string): Promise<string> {
    const since = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

    const messages = await prisma.message.findMany({
      where: { serverId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        content: true,
        username: true,
        channelId: true,
        createdAt: true,
        isToxic: true,
      },
    });

    if (messages.length === 0) {
      return `**📊 Daily Summary** (Server: \`${serverId}\`)\n\nNo messages in the last 24 hours.`;
    }

    const toxicCount = messages.filter((m) => m.isToxic).length;

    const structured = await generateDailySummary(
      messages.map((m) => ({
        content: m.content,
        username: m.username,
        channelId: m.channelId,
        createdAt: m.createdAt,
        isToxic: m.isToxic,
      }))
    );

    if (structured) {
      logger.info('Generated AI daily summary', { serverId, messageCount: messages.length });
      return formatStructuredSummary(serverId, structured, toxicCount);
    }

    const uniqueUsers = new Set(messages.map((m) => m.username)).size;
    const channelIds = new Set(messages.map((m) => m.channelId)).size;
    logger.info('Generated fallback daily summary', { serverId, messageCount: messages.length });
    return formatFallbackSummary(
      serverId,
      messages.length,
      uniqueUsers,
      channelIds,
      toxicCount
    );
  }
}

export const summaryService = new SummaryService();
