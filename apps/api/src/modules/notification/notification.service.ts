import { Injectable } from '@nestjs/common';
import { NotificationType } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QueueService } from '../../infra/queue/queue.service';
import { JOB, QUEUE } from '../../infra/queue/queue.constants';

export interface NotificationView {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  /**
   * 站内通知立即落库（用户端可见），并入队异步发送邮件/短信。
   * 通知内容克制：例如「你的信箱里有一封新来信」，不剧透正文。
   */
  async push(
    userId: bigint,
    type: NotificationType,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    const row = await this.prisma.notification.create({
      data: { userId, type, payload: payload as object },
    });
    await this.queue.add(QUEUE.NOTIFICATION, JOB.SEND_NOTIFICATION, {
      notificationId: row.id.toString(),
      userId: userId.toString(),
      type,
    });
  }

  async listUnread(userId: bigint): Promise<NotificationView[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((n) => ({
      id: n.id.toString(),
      type: n.type,
      payload: n.payload as Record<string, unknown>,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markRead(userId: bigint, ids: bigint[]): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { isRead: true },
    });
    return { updated: res.count };
  }
}
