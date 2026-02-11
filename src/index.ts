import { Client, GatewayIntentBits, type ClientEvents } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { prisma } from '../db/client';
import { stopDailySummaryScheduler } from './scheduler/dailySummary';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

type EventHandler<K extends keyof ClientEvents> = {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => void | Promise<void>;
};

async function loadEvents(): Promise<void> {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = (await import(filePath)) as EventHandler<keyof ClientEvents>;

    if (event.name && event.execute) {
      if (event.once) {
        client.once(event.name, event.execute as (...args: unknown[]) => void);
      } else {
        client.on(event.name, event.execute as (...args: unknown[]) => void);
      }
      logger.debug(`Loaded event: ${event.name}`);
    }
  }
}

async function main(): Promise<void> {
  try {
    await loadEvents();
    await client.login(config.discordToken);
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  stopDailySummaryScheduler();
  await prisma.$disconnect();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  stopDailySummaryScheduler();
  await prisma.$disconnect();
  client.destroy();
  process.exit(0);
});

main().catch((err) => {
  logger.error('Unhandled error:', err);
  process.exit(1);
});
