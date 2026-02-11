import { prisma } from '../db/client';
import { logger } from '../utils/logger';

export interface SaveMessageParams {
  serverId: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  isToxic?: boolean;
}

export class MessageService {
  async saveMessage(params: SaveMessageParams): Promise<void> {
    try {
      await prisma.message.create({
        data: {
          serverId: params.serverId,
          channelId: params.channelId,
          userId: params.userId,
          username: params.username,
          content: params.content,
          isToxic: params.isToxic ?? false,
        },
      });
      logger.debug('Message saved', { channelId: params.channelId, userId: params.userId });
    } catch (error) {
      logger.error('Failed to save message:', error);
      throw error;
    }
  }

  async getMessagesByServer(serverId: string, since?: Date): Promise<{ content: string; username: string; createdAt: Date }[]> {
    const where = { serverId };
    if (since) {
      Object.assign(where, { createdAt: { gte: since } });
    }
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: { content: true, username: true, createdAt: true },
    });
    return messages;
  }

  async getMessageCountByServer(serverId: string, since?: Date): Promise<number> {
    const where = { serverId };
    if (since) {
      Object.assign(where, { createdAt: { gte: since } });
    }
    return prisma.message.count({ where });
  }
}

export const messageService = new MessageService();
