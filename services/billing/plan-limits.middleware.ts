/**
 * Plan limits middleware.
 * FREE: 1k msgs/day, 1 summary/day
 * STARTER: 5k msgs/day, 2 summaries/day
 * PRO: 25k msgs/day, 4 summaries/day
 */

import { prisma } from '../../db/client';
import { serverService } from '../server.service';
import { PLAN_LIMITS } from './limits';
import type { LimitCheckResult, Plan } from './types';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if the server can save another message today.
 * FREE: max 1000/day. PRO: unlimited.
 */
export async function canSaveMessage(serverId: string): Promise<LimitCheckResult> {
  const server = await serverService.get(serverId);
  if (!server) {
    return { allowed: true };
  }

  const limits = PLAN_LIMITS[server.plan as Plan];
  if (limits.maxMessagesPerDay === Number.POSITIVE_INFINITY) {
    return { allowed: true };
  }

  const since = startOfToday();
  const count = await prisma.message.count({
    where: { serverId, createdAt: { gte: since } },
  });

  return {
    allowed: count < limits.maxMessagesPerDay,
    current: count,
    limit: limits.maxMessagesPerDay,
    reason: count >= limits.maxMessagesPerDay
      ? `Plan limit: ${limits.maxMessagesPerDay} messages/day reached. Upgrade for more.`
      : undefined,
  };
}

/**
 * Check if the server can run a daily summary now.
 * Uses SummaryRun table to count runs per day.
 */
export async function canRunDailySummary(serverId: string): Promise<LimitCheckResult> {
  const server = await serverService.get(serverId);
  if (!server) {
    return { allowed: true };
  }

  const limits = PLAN_LIMITS[server.plan as Plan];
  if (limits.summariesPerDay === Number.POSITIVE_INFINITY) {
    return { allowed: true };
  }

  const since = startOfToday();
  const count = await prisma.summaryRun.count({
    where: { serverId, runAt: { gte: since } },
  });

  return {
    allowed: count < limits.summariesPerDay,
    current: count,
    limit: limits.summariesPerDay,
    reason: count >= limits.summariesPerDay
      ? `Plan limit: ${limits.summariesPerDay} summary(ies) per day. Upgrade for more.`
      : undefined,
  };
}
