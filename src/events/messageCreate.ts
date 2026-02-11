import { Events, type Message } from 'discord.js';
import { messageService } from '../../services/message.service';
import { toxicityService } from '../../services/toxicity.service';
import { serverService } from '../../services/server.service';
import { canSaveMessage } from '../../services/billing/plan-limits.middleware';
import { logger } from '../../utils/logger';

export const name = Events.MessageCreate;

export async function execute(message: Message): Promise<void> {
  if (message.author.bot) return;

  const content = message.content?.trim();
  if (!content) return;

  try {
    const guild = message.guild;
    const guildId = guild?.id;
    const channelId = message.channel.id;
    const userId = message.author.id;
    const username = message.author.username;

    if (!guildId || !guild) {
      logger.debug('Skipping DM message (no guild)');
      return;
    }

    await serverService.getOrCreate(guildId, guild.name);

    const limitCheck = await canSaveMessage(guildId);
    if (!limitCheck.allowed) {
      logger.debug('Message not saved: plan limit reached', { serverId: guildId, reason: limitCheck.reason });
      return;
    }

    const toxicity = await toxicityService.checkToxicity(content);

    await messageService.saveMessage({
      serverId: guildId,
      channelId,
      userId,
      username,
      content,
      isToxic: toxicity.isToxic,
    });

    if (toxicity.isToxic) {
      logger.debug('Toxic message stored', {
        serverId: guildId,
        channelId,
        username,
        confidence: toxicity.confidence,
      });
    }
  } catch (error) {
    logger.error('Error handling message:', error);
  }
}
