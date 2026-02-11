import type { Guild } from 'discord.js';
import { logger } from '../../utils/logger';
import { reportService } from '../services/report.service';
import { serverService } from '../../services/server.service';

let schedulerInterval: NodeJS.Timeout | null = null;

const TICK_MS = 15 * 60 * 1000; // Run every 15 minutes

function getCurrentHourInTimezone(timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  });
  return parseInt(formatter.format(new Date()), 10);
}

function getCurrentMinuteInTimezone(timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    minute: '2-digit',
  });
  return parseInt(formatter.format(new Date()), 10);
}

/**
 * Cron job: runs daily summary per server at each server's configured hour (in their timezone).
 * Ticks every 15 minutes and runs for servers whose local time matches their summary hour.
 */
export function startDailySummaryScheduler(getGuilds: () => Iterable<Guild>): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  async function tick() {
    const guilds = Array.from(getGuilds());
    if (guilds.length === 0) return;

    for (const guild of guilds) {
      try {
        const { hour, timezone } = await serverService.getSummarySchedule(guild.id);
        const currentHour = getCurrentHourInTimezone(timezone);
        const currentMinute = getCurrentMinuteInTimezone(timezone);

        // Only trigger in the first 15 min of the target hour to avoid duplicate runs
        if (currentHour === hour && currentMinute < 15) {
          await reportService.sendDailyReportToAdmins(guild);
        }
      } catch (err) {
        logger.error(`Daily summary tick failed for ${guild.name}:`, err);
      }
    }
  }

  logger.info('Daily summary scheduler started (ticks every 15 min, per-server time)');
  schedulerInterval = setInterval(() => tick().catch((e) => logger.error('Scheduler tick error:', e)), TICK_MS);
  tick().catch((e) => logger.error('Initial scheduler tick error:', e));
}

export function stopDailySummaryScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Daily summary scheduler stopped');
  }
}
