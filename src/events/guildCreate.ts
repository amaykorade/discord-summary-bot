import { Events, type Guild } from 'discord.js';
import { serverService } from '../../services/server.service';
import { logger } from '../../utils/logger';

export const name = Events.GuildCreate;

export async function execute(guild: Guild): Promise<void> {
  try {
    await serverService.getOrCreate(guild.id, guild.name);
    logger.info('Server registered', { serverId: guild.id, name: guild.name });
  } catch (error) {
    logger.error('Failed to register server on guild join:', error);
  }
}
