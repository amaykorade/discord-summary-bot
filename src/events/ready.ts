import { Routes } from 'discord-api-types/v10';
import { Events, type Client } from 'discord.js';
import { logger } from '../../utils/logger';
import { startDailySummaryScheduler } from '../scheduler/dailySummary';
import { commands } from '../commands';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client<true>): Promise<void> {
  logger.info(`Logged in as ${client.user.tag}`);
  logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
  startDailySummaryScheduler(() => client.guilds.cache.values());

  // Register slash commands globally
  try {
    const body = commands.map((c) => c.data.toJSON());
    await client.rest.put(Routes.applicationCommands(client.application.id), { body });
    logger.info(`Registered ${commands.length} slash command(s)`);
  } catch (error) {
    logger.error('Failed to register slash commands:', error);
  }
}
