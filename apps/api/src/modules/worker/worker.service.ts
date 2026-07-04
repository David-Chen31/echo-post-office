import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Worker } from 'bullmq';
import { JOB, QUEUE } from '../../infra/queue/queue.constants';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { MailService } from '../../infra/mail/mail.service';
import { ClaimService } from '../claim/claim.service';

/**
 * 队列消费者 + 定时兜底任务。
 * MVP 与 API 同进程运行；规模上来后可拆为独立 worker 进程。
 */
@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private workers: Worker[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly claims: ClaimService,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    const connection = { url } as never;

    // 通知发送
    this.workers.push(
      new Worker(
        QUEUE.NOTIFICATION,
        async (job) => {
          if (job.name !== JOB.SEND_NOTIFICATION) return;
          await this.handleNotification(BigInt(job.data.notificationId as string));
        },
        { connection },
      ),
    );

    // 领取超时释放（延迟任务）
    this.workers.push(
      new Worker(
        QUEUE.CLAIM_EXPIRE,
        async (job) => {
          if (job.name !== JOB.RELEASE_EXPIRED) return;
          await this.claims.releaseIfExpired(BigInt(job.data.claimId as string));
        },
        { connection },
      ),
    );

    for (const w of this.workers) {
      w.on('failed', (job, err) => this.logger.error(`Job ${job?.id} failed: ${err.message}`));
    }
    this.logger.log('BullMQ workers started');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
  }

  private async handleNotification(notificationId: bigint): Promise<void> {
    const n = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!n) return;
    const user = await this.prisma.user.findUnique({ where: { id: n.userId } });
    const target = user?.email ?? user?.phone;
    if (!target) return;
    const payload = n.payload as { message?: string };
    await this.mail.sendNotification(target, '回声邮局', payload.message ?? '你有一条新通知');
  }

  /** 定时兜底：每分钟扫描过期领取并释放（延迟任务的双保险）。 */
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredFallback(): Promise<void> {
    const count = await this.claims.releaseAllExpired();
    if (count > 0) this.logger.log(`Fallback released ${count} expired claims`);
  }
}
