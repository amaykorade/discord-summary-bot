import { ChannelType, type Guild, type TextChannel } from 'discord.js';
import { prisma } from '../../db/client';
import { summaryService } from '../../services/summary.service';
import { serverService } from '../../services/server.service';
import { canRunDailySummary } from '../../services/billing/plan-limits.middleware';
import { logger } from '../../utils/logger';

const PREFERRED_CHANNEL_NAMES = ['mod-log', 'admin', 'reports', 'bot', 'moderation'];
const MAX_LENGTH = 1900;
const NO_ACTIVITY_MESSAGE = '**📊 Daily Summary** — No activity in the last 24 hours.';

/**
 * Smart truncate: cut at last sentence boundary (. ! ?) or word boundary before maxLen.
 */
function smartTruncate(text: string, maxLen: number, suffix = '…'): string {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen - suffix.length);
  const lastSentence = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  );
  if (lastSentence > maxLen * 0.5) {
    return slice.slice(0, lastSentence + 1).trimEnd() + suffix;
  }
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 0) {
    return slice.slice(0, lastSpace).trimEnd() + suffix;
  }
  return slice.trimEnd() + suffix;
}

/** Build summary part (header + chat summary + topics + channels) and stats part separately. */
function buildReportParts(data: {
  shortSummary: string;
  topics: string[];
  mostActiveChannels: { channelId: string; channelName?: string; messageCount: number }[];
  totalMessages: number;
  toxicUsersCount: number;
  toxicMessagesCount: number;
}): { summaryPart: string; statsPart: string; full: string } {
  const topicLines =
    data.topics.length > 0
      ? data.topics.map((t) => `  • ${t}`).join('\n')
      : '  _(none)_';

  const channelLines =
    data.mostActiveChannels.length > 0
      ? data.mostActiveChannels
          .slice(0, 5)
          .map((c) => `  • ${c.channelName ?? c.channelId}: ${c.messageCount}`)
          .join('\n')
      : '  _(none)_';

  const statsPart = [
    '**Messages today:** ' + data.totalMessages,
    '**Toxic users flagged:** ' + data.toxicUsersCount,
    '**Toxic messages:** ' + data.toxicMessagesCount,
  ].join('\n');

  const summaryPart = [
    '**📊 Daily Summary**',
    '',
    '**Chat summary**',
    data.shortSummary,
    '',
    '**Topics**',
    topicLines,
    '',
    '**Most active channels**',
    channelLines,
  ].join('\n');

  const full = summaryPart + '\n\n' + statsPart;
  return { summaryPart, statsPart, full };
}

/**
 * Formats daily summary into one or two Discord messages. Uses smart truncation
 * on the chat summary first; if still too long, splits into summary + stats.
 */
function formatSummaryMessages(data: {
  shortSummary: string;
  topics: string[];
  mostActiveChannels: { channelId: string; channelName?: string; messageCount: number }[];
  totalMessages: number;
  toxicUsersCount: number;
  toxicMessagesCount: number;
}): string[] {
  const { summaryPart, statsPart, full } = buildReportParts(data);

  if (full.length <= MAX_LENGTH) return [full];

  // Try smart truncating just the chat summary so the full report fits in one message
  const overhead = summaryPart.length - data.shortSummary.length;
  const maxSummaryLen = MAX_LENGTH - overhead - statsPart.length - 10; // \n\n + buffer
  if (maxSummaryLen > 50) {
    const truncatedSummary = smartTruncate(data.shortSummary, maxSummaryLen);
    const rebuilt = buildReportParts({ ...data, shortSummary: truncatedSummary });
    if (rebuilt.full.length <= MAX_LENGTH) return [rebuilt.full];
  }

  // Split into 2 messages: summary first, then stats. Truncate chat summary if needed.
  let part1 = summaryPart;
  if (summaryPart.length > MAX_LENGTH) {
    const header = '**📊 Daily Summary**\n\n**Chat summary**\n';
    const tail = '\n\n**Topics**\n' +
      (data.topics.length > 0 ? data.topics.map((t) => `  • ${t}`).join('\n') : '  _(none)_') +
      '\n\n**Most active channels**\n' +
      (data.mostActiveChannels.length > 0
        ? data.mostActiveChannels.slice(0, 5).map((c) => `  • ${c.channelName ?? c.channelId}: ${c.messageCount}`).join('\n')
        : '  _(none)_');
    const maxLen = MAX_LENGTH - header.length - tail.length - 5;
    part1 = header + smartTruncate(data.shortSummary, maxLen) + tail;
  }
  return [part1, statsPart];
}

/**
 * Sends daily summary report. Uses summary channel if set, otherwise falls back to admin channels.
 */
export class ReportService {
  async sendDailyReportToAdmins(guild: Guild): Promise<void> {
    try {
      await serverService.getOrCreate(guild.id, guild.name);

      const limitCheck = await canRunDailySummary(guild.id);
      if (!limitCheck.allowed) {
        logger.debug('Skipping daily summary: plan limit', { serverId: guild.id, reason: limitCheck.reason });
        return;
      }

      const summaryChannelId = await serverService.getSummaryChannelId(guild.id);

      if (summaryChannelId) {
        await this.sendToSummaryChannel(guild, summaryChannelId);
        return;
      }

      await this.sendToAdminChannels(guild);
    } catch (error) {
      logger.error('Failed to send daily report:', error);
    }
  }

  private async sendToSummaryChannel(guild: Guild, channelId: string): Promise<void> {
    const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel?.isTextBased() || channel.type !== ChannelType.GuildText) {
      logger.warn(`Summary channel ${channelId} not found or invalid in ${guild.name}`);
      return;
    }

    const data = await summaryService.getDailySummaryData(guild.id);
    if (!data) {
      logger.warn('No summary data for guild', { guildId: guild.id });
      return;
    }

    const resolved = {
      ...data,
      mostActiveChannels: data.mostActiveChannels.map((c) => ({
        ...c,
        channelName: (guild.channels.cache.get(c.channelId) as TextChannel | undefined)?.name ?? c.channelId,
      })),
    };

    const sendOpts = { allowedMentions: { parse: [] as const } };

    if (resolved.totalMessages === 0) {
      await channel.send({ content: NO_ACTIVITY_MESSAGE, ...sendOpts });
    } else {
      const messages = formatSummaryMessages(resolved);
      for (const content of messages) {
        await channel.send({ content, ...sendOpts });
      }
    }

    await serverService.setLastSummaryAt(guild.id, new Date());
    await prisma.summaryRun.create({ data: { serverId: guild.id } });
    logger.info(`Daily summary sent to #${channel.name} in ${guild.name}`);
  }

  private async sendToAdminChannels(guild: Guild): Promise<void> {
    const data = await summaryService.getDailySummaryData(guild.id);
    if (!data) {
      logger.warn('No summary data for guild', { guildId: guild.id });
      return;
    }

    const resolved = {
      ...data,
      mostActiveChannels: data.mostActiveChannels.map((c) => ({
        ...c,
        channelName: (guild.channels.cache.get(c.channelId) as TextChannel | undefined)?.name ?? c.channelId,
      })),
    };

    const sendOpts = { allowedMentions: { parse: [] as const } };
    const contentToSend =
      resolved.totalMessages === 0 ? [NO_ACTIVITY_MESSAGE] : formatSummaryMessages(resolved);

    const adminChannels = await this.getAdminChannels(guild);
    if (adminChannels.length === 0) {
      logger.warn(`No admin channel found for guild ${guild.name}. Use /set-summary-channel to configure.`);
      return;
    }

    let summaryRecorded = false;
    for (const channel of adminChannels) {
      try {
        for (const content of contentToSend) {
          await channel.send({ content, ...sendOpts });
        }
        if (!summaryRecorded) {
          await serverService.setLastSummaryAt(guild.id, new Date());
          await prisma.summaryRun.create({ data: { serverId: guild.id } });
          summaryRecorded = true;
        }
        logger.info(`Daily report sent to #${channel.name} in ${guild.name}`);
      } catch (err) {
        logger.error(`Failed to send report to #${channel.name}:`, err);
      }
    }
  }

  private async getAdminChannels(guild: Guild): Promise<TextChannel[]> {
    const preferred: TextChannel[] = [];
    const others: TextChannel[] = [];
    const me = guild.members.me;

    for (const channel of guild.channels.cache.values()) {
      if (channel.type !== ChannelType.GuildText) continue;
      const textChannel = channel as TextChannel;
      const canSend = me && textChannel.permissionsFor(me)?.has('SendMessages');
      if (!canSend) continue;

      const name = textChannel.name.toLowerCase();
      const isPreferred = PREFERRED_CHANNEL_NAMES.some((n) => name.includes(n));
      if (isPreferred) preferred.push(textChannel);
      else others.push(textChannel);
    }

    return [...preferred, ...others].slice(0, 3);
  }
}

export const reportService = new ReportService();
