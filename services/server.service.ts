import { prisma } from '../db/client';
import type { Plan } from './billing/types';

export type { Plan };

export class ServerService {
  async getOrCreate(serverId: string, name: string): Promise<{ serverId: string; name: string; plan: Plan }> {
    const server = await prisma.server.upsert({
      where: { serverId },
      create: { serverId, name, plan: 'FREE' },
      update: { name },
    });
    return { serverId: server.serverId, name: server.name, plan: server.plan as Plan };
  }

  async get(serverId: string): Promise<{ serverId: string; name: string; plan: Plan } | null> {
    const server = await prisma.server.findUnique({
      where: { serverId },
      select: { serverId: true, name: true, plan: true },
    });
    return server ? { ...server, plan: server.plan as Plan } : null;
  }

  async getSummaryChannelId(serverId: string): Promise<string | null> {
    const server = await prisma.server.findUnique({
      where: { serverId },
      select: { summaryChannelId: true },
    });
    return server?.summaryChannelId ?? null;
  }

  async setSummaryChannel(serverId: string, channelId: string): Promise<void> {
    await prisma.server.upsert({
      where: { serverId },
      create: { serverId, name: '', summaryChannelId: channelId },
      update: { summaryChannelId: channelId },
    });
  }

  async getSummarySchedule(serverId: string): Promise<{ hour: number; timezone: string }> {
    const server = await prisma.server.findUnique({
      where: { serverId },
      select: { summaryHour: true, summaryTimezone: true },
    });
    return {
      hour: server?.summaryHour ?? 0,
      timezone: server?.summaryTimezone ?? 'UTC',
    };
  }

  async setSummarySchedule(serverId: string, hour: number, timezone: string): Promise<void> {
    await prisma.server.upsert({
      where: { serverId },
      create: { serverId, name: '', summaryHour: hour, summaryTimezone: timezone },
      update: { summaryHour: hour, summaryTimezone: timezone },
    });
  }

  async setLastSummaryAt(serverId: string, at: Date): Promise<void> {
    await prisma.server.updateMany({
      where: { serverId },
      data: { lastSummaryAt: at },
    });
  }

  async getLastSummaryAt(serverId: string): Promise<Date | null> {
    const server = await prisma.server.findUnique({
      where: { serverId },
      select: { lastSummaryAt: true },
    });
    return server?.lastSummaryAt ?? null;
  }

  /** For Stripe webhooks: update plan when subscription changes */
  async setPlan(serverId: string, plan: Plan): Promise<void> {
    await prisma.server.updateMany({
      where: { serverId },
      data: { plan },
    });
  }
}

export const serverService = new ServerService();
