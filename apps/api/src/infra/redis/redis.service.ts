import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis 封装：缓存、验证码、限流、分布式锁、跳过集合。
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, { maxRetrysPerRequest: null } as never);
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (e) => this.logger.error(`Redis error: ${e.message}`));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  // ---------- 通用 KV ----------
  async setEx(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // ---------- 限流：固定窗口计数 ----------
  /** 返回当前窗口内的计数；首次访问设置过期。 */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  // ---------- 分布式锁（SET NX EX） ----------
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const res = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return res === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.del(key);
  }

  // ---------- 集合（跳过的信件） ----------
  async addToSet(key: string, member: string, ttlSeconds: number): Promise<void> {
    await this.client.sadd(key, member);
    await this.client.expire(key, ttlSeconds);
  }

  async setMembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }
}
