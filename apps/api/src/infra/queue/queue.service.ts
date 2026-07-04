import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QUEUE, QueueName } from './queue.constants';

/**
 * BullMQ 生产者封装。Worker 消费者在 worker 模块单独定义。
 */
@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private queues = new Map<QueueName, Queue>();
  private connection!: { url: string };

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.connection = { url };
    for (const name of Object.values(QUEUE)) {
      this.queues.set(name, new Queue(name, { connection: { url } as never }));
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }

  private q(name: QueueName): Queue {
    const queue = this.queues.get(name);
    if (!queue) throw new Error(`Queue not initialized: ${name}`);
    return queue;
  }

  async add(name: QueueName, jobName: string, data: unknown): Promise<void> {
    await this.q(name).add(jobName, data, {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  /** 延迟任务：用于领取超时释放。 */
  async addDelayed(
    name: QueueName,
    jobName: string,
    data: unknown,
    delayMs: number,
  ): Promise<void> {
    await this.q(name).add(jobName, data, {
      delay: delayMs,
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 3,
    });
  }
}
