import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { ApiCode, ClaimStatus, LetterStatus, LIMITS } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { QueueService } from '../../infra/queue/queue.service';
import { JOB, QUEUE } from '../../infra/queue/queue.constants';
import { UserService } from '../user/user.service';
import { LetterService } from '../letter/letter.service';
import { LetterEvent, LetterReaderView, toReaderView } from '../letter/letter.types';
import { BusinessException } from '../../common/errors/business.exception';
import { dayStamp, secondsUntilEndOfDay } from '../../common/utils/quota';

export interface ClaimResult {
  claimId: string;
  expiresAt: string;
  letter: LetterReaderView;
}

@Injectable()
export class ClaimService {
  private readonly logger = new Logger(ClaimService.name);
  private readonly expireHours: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queue: QueueService,
    private readonly users: UserService,
    private readonly letters: LetterService,
    config: ConfigService,
  ) {
    this.expireHours = Number(config.get<string>('CLAIM_EXPIRE_HOURS', String(LIMITS.CLAIM_EXPIRE_HOURS)));
  }

  private skipKey(readerId: bigint): string {
    return `claim:skip:${readerId}`;
  }

  /** 跳过一封信：短期内不再分配给该读者。 */
  async skip(readerId: bigint, letterId: bigint): Promise<{ ok: boolean }> {
    await this.redis.addToSet(this.skipKey(readerId), letterId.toString(), 7 * 24 * 3600);
    return { ok: true };
  }

  /**
   * 窥视待回信箱：返回一封候选来信（只读，不领取、不加锁）。
   * 用户阅读后再决定是否「领取这封信」。每次只出现一封。
   */
  async peek(readerId: bigint): Promise<LetterReaderView | null> {
    const blockedIds = await this.users.getBlockedIds(readerId);
    const skipped = await this.redis.setMembers(this.skipKey(readerId));
    const blockExpr = blockedIds.length ? blockedIds : [BigInt(0)];
    const excludeExpr = skipped.length ? skipped.map((s) => BigInt(s)) : [BigInt(0)];

    // 读者感兴趣主题：优先分配匹配的信，但以最老待领取为兜底次序，避免非偏好主题饥饿。
    const me = await this.prisma.user.findUnique({
      where: { id: readerId },
      select: { interestedTopics: true },
    });
    const topics = Array.isArray(me?.interestedTopics) ? (me!.interestedTopics as string[]) : [];
    const topicExpr = topics.length ? topics : [''];

    const rows = await this.prisma.$queryRaw<{ id: bigint }[]>(Prisma.sql`
      SELECT l."id"
      FROM "letters" l
      WHERE l."status" = ${LetterStatus.WAITING_CLAIM}::"LetterStatus"
        AND l."riskLevel" <> 'HIGH'::"RiskLevel"
        AND l."authorId" <> ${readerId}
        AND l."authorId" <> ALL(${blockExpr}::bigint[])
        AND l."id" <> ALL(${excludeExpr}::bigint[])
        AND NOT EXISTS (
          SELECT 1 FROM "letter_claims" c
          WHERE c."letterId" = l."id" AND c."readerId" = ${readerId}
        )
        AND (
          SELECT count(*) FROM "letter_claims" c2
          WHERE c2."letterId" = l."id" AND c2."status" IN ('CLAIMED'::"ClaimStatus", 'REPLIED'::"ClaimStatus")
        ) < l."maxReplies"
      ORDER BY (l."category"::text = ANY(${topicExpr}::text[])) DESC, l."publishedAt" ASC NULLS LAST
      LIMIT 1
    `);
    if (rows.length === 0) return null;
    const letter = await this.prisma.letter.findUniqueOrThrow({ where: { id: rows[0].id } });
    return toReaderView(letter);
  }

  /**
   * 领取指定信件（抢占核心）。事务内对该信 FOR UPDATE SKIP LOCKED 加锁，
   * 复核可领取条件后写入领取记录，避免并发重复领取。
   */
  async claimById(readerId: bigint, letterId: bigint): Promise<ClaimResult> {
    await this.assertClaimQuota(readerId);

    const result = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: bigint }[]>(Prisma.sql`
        SELECT l."id"
        FROM "letters" l
        WHERE l."id" = ${letterId}
          AND l."status" = ${LetterStatus.WAITING_CLAIM}::"LetterStatus"
          AND l."riskLevel" <> 'HIGH'::"RiskLevel"
          AND l."authorId" <> ${readerId}
          AND NOT EXISTS (
            SELECT 1 FROM "letter_claims" c
            WHERE c."letterId" = l."id" AND c."readerId" = ${readerId}
          )
          AND (
            SELECT count(*) FROM "letter_claims" c2
            WHERE c2."letterId" = l."id" AND c2."status" IN ('CLAIMED'::"ClaimStatus", 'REPLIED'::"ClaimStatus")
          ) < l."maxReplies"
        FOR UPDATE OF l SKIP LOCKED
        LIMIT 1
      `);
      if (rows.length === 0) return null;

      const expiresAt = new Date(Date.now() + this.expireHours * 3600 * 1000);
      const claim = await tx.letterClaim.create({
        data: { letterId, readerId, status: ClaimStatus.CLAIMED, expiresAt },
      });
      const letter = await tx.letter.findUniqueOrThrow({ where: { id: letterId } });
      if (letter.maxReplies <= 1) {
        await tx.letter.update({ where: { id: letterId }, data: { status: LetterStatus.CLAIMED } });
      }
      return { claim, letter };
    });

    if (!result) {
      throw new BusinessException(ApiCode.LETTER_NOT_CLAIMABLE, '这封信已经被领走或不可领取了，换一封看看');
    }

    await this.consumeClaimQuota(readerId);
    await this.queue.addDelayed(
      QUEUE.CLAIM_EXPIRE,
      JOB.RELEASE_EXPIRED,
      { claimId: result.claim.id.toString() },
      this.expireHours * 3600 * 1000,
    );

    return {
      claimId: result.claim.id.toString(),
      expiresAt: result.claim.expiresAt.toISOString(),
      letter: toReaderView(result.letter),
    };
  }

  /**
   * 释放一个领取（超时未回信）。幂等：只有仍处于 CLAIMED 且已过期才释放。
   * 被 worker 的延迟任务与定时兜底共同调用。
   */
  async releaseIfExpired(claimId: bigint): Promise<boolean> {
    const claim = await this.prisma.letterClaim.findUnique({ where: { id: claimId } });
    if (!claim || claim.status !== ClaimStatus.CLAIMED) return false;
    if (claim.expiresAt.getTime() > Date.now()) return false;

    await this.prisma.letterClaim.update({
      where: { id: claimId },
      data: { status: ClaimStatus.EXPIRED },
    });
    await this.letters.advanceState(claim.letterId, LetterEvent.RELEASED);
    this.logger.log(`Claim ${claimId} expired and released letter ${claim.letterId}`);
    return true;
  }

  /** 定时兜底：扫描所有过期未处理的领取。 */
  async releaseAllExpired(): Promise<number> {
    const expired = await this.prisma.letterClaim.findMany({
      where: { status: ClaimStatus.CLAIMED, expiresAt: { lt: new Date() } },
      select: { id: true },
      take: 500,
    });
    let count = 0;
    for (const c of expired) {
      if (await this.releaseIfExpired(c.id)) count++;
    }
    return count;
  }

  /** 标记领取已回信（由 reply 模块调用）。 */
  async markReplied(claimId: bigint): Promise<void> {
    await this.prisma.letterClaim.update({
      where: { id: claimId },
      data: { status: ClaimStatus.REPLIED },
    });
  }

  // ---------- 配额 ----------
  private async assertClaimQuota(readerId: bigint): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: readerId } });
    if (!user || user.status === 'DELETED' || user.status === 'BANNED') {
      throw new BusinessException(ApiCode.FORBIDDEN, '账号状态异常');
    }
    if (user.status === 'REPLY_LIMITED') {
      throw new BusinessException(ApiCode.FORBIDDEN, '你的回信功能已被限制');
    }
    const key = `quota:claim:${readerId}:${dayStamp()}`;
    const used = Number((await this.redis.get(key)) ?? 0);
    if (used >= user.dailyClaimQuota) {
      throw new BusinessException(ApiCode.QUOTA_EXCEEDED, '今天领取的来信已达上限，好好回复手上的信吧');
    }
  }

  private async consumeClaimQuota(readerId: bigint): Promise<void> {
    const key = `quota:claim:${readerId}:${dayStamp()}`;
    await this.redis.incrWithTtl(key, secondsUntilEndOfDay());
  }
}
