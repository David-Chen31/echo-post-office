import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApiCode,
  LetterDraftDto,
  LetterStatus,
  ModTargetType,
  RiskLevel,
  SubmitLetterDto,
} from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { ModerationService } from '../moderation/moderation.service';
import { detectAll, maskContent } from '../moderation/detectors';
import { BusinessException } from '../../common/errors/business.exception';
import { dayStamp, secondsUntilEndOfDay } from '../../common/utils/quota';
import { LetterEvent, LetterOwnerView, toOwnerView } from './letter.types';

@Injectable()
export class LetterService {
  private readonly logger = new Logger(LetterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly moderation: ModerationService,
  ) {}

  async saveDraft(userId: bigint, dto: LetterDraftDto): Promise<{ draftId: string }> {
    // 服务端草稿兜底：一个用户保留最近一份草稿（按 userId upsert 最新）。
    const existing = await this.prisma.letterDraft.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    const draft = existing
      ? await this.prisma.letterDraft.update({
          where: { id: existing.id },
          data: { title: dto.title, content: dto.content, category: dto.category, mood: dto.mood },
        })
      : await this.prisma.letterDraft.create({
          data: {
            userId,
            title: dto.title,
            content: dto.content,
            category: dto.category,
            mood: dto.mood,
          },
        });
    return { draftId: draft.id.toString() };
  }

  /**
   * 投递信件（状态机入口）：
   * 落库 SUBMITTED -> 自动检测（遮挡联系方式 / 识别高风险）
   *   - 高风险 -> UNDER_MODERATION（进人工队列）
   *   - 否则   -> WAITING_CLAIM（可被领取）
   */
  async submit(userId: bigint, dto: SubmitLetterDto, idemKey?: string): Promise<LetterOwnerView> {
    if (idemKey) await this.assertIdempotent(userId, idemKey);
    await this.assertWriteQuota(userId);

    // 称谓 / 署名为短文本，同样遮挡其中的联系方式，防止绕过正文检测留联系方式。
    const maskShort = (s?: string): string | null => {
      const v = s?.trim();
      if (!v) return null;
      return maskContent(v, detectAll(v));
    };

    const letter = await this.prisma.letter.create({
      data: {
        authorId: userId,
        title: dto.title ?? null,
        salutation: maskShort(dto.salutation),
        signature: maskShort(dto.signature),
        signedDate: dto.signedDate?.trim() || null,
        content: dto.content,
        category: dto.category,
        mood: dto.mood ?? null,
        replyPreference: (dto.replyPreference ?? {}) as object,
        isPublic: dto.isPublic ?? false,
        maxReplies: dto.maxReplies ?? 1,
        status: LetterStatus.SUBMITTED,
      },
    });

    const check = await this.moderation.autoCheck({
      type: ModTargetType.LETTER,
      id: letter.id,
      content: letter.content,
    });

    const data: Prisma.LetterUpdateInput = {
      content: check.maskedContent, // 落库已遮挡联系方式的内容
      riskLevel: check.riskLevel,
    };
    if (check.needsManual) {
      data.status = LetterStatus.UNDER_MODERATION;
    } else {
      data.status = LetterStatus.WAITING_CLAIM;
      data.publishedAt = new Date();
    }

    const updated = await this.prisma.letter.update({ where: { id: letter.id }, data });
    await this.consumeWriteQuota(userId);
    return toOwnerView(updated);
  }

  async getOwnedById(userId: bigint, letterId: bigint): Promise<LetterOwnerView> {
    const letter = await this.prisma.letter.findUnique({ where: { id: letterId } });
    if (!letter || letter.authorId !== userId) {
      throw new BusinessException(ApiCode.NOT_FOUND, '信件不存在');
    }
    return toOwnerView(letter);
  }

  /** 作者关闭信件（停止接收新回信）。 */
  async close(userId: bigint, letterId: bigint): Promise<{ ok: boolean }> {
    const letter = await this.prisma.letter.findUnique({ where: { id: letterId } });
    if (!letter || letter.authorId !== userId) {
      throw new BusinessException(ApiCode.NOT_FOUND, '信件不存在');
    }
    await this.advanceState(letterId, LetterEvent.CLOSE);
    return { ok: true };
  }

  /**
   * 状态机唯一入口。被 claim / reply / moderation 模块调用。
   */
  async advanceState(letterId: bigint, event: LetterEvent): Promise<void> {
    const letter = await this.prisma.letter.findUnique({ where: { id: letterId } });
    if (!letter) throw new BusinessException(ApiCode.NOT_FOUND, '信件不存在');

    const next = this.transition(letter.status as LetterStatus, event, letter);
    if (next === letter.status) return;

    await this.prisma.letter.update({
      where: { id: letterId },
      data: {
        status: next,
        ...(next === LetterStatus.WAITING_CLAIM && !letter.publishedAt
          ? { publishedAt: new Date() }
          : {}),
        ...(next === LetterStatus.CLOSED ? { closedAt: new Date() } : {}),
      },
    });
  }

  private transition(
    current: LetterStatus,
    event: LetterEvent,
    letter: { maxReplies: number },
  ): LetterStatus {
    switch (event) {
      case LetterEvent.PUBLISH:
        return LetterStatus.WAITING_CLAIM;
      case LetterEvent.TO_MODERATION:
        return LetterStatus.UNDER_MODERATION;
      case LetterEvent.REJECT:
        return LetterStatus.REJECTED;
      case LetterEvent.CLAIMED:
        // 单回信信件被领取后进入 CLAIMED；多回信信件仍可保持 WAITING_CLAIM。
        return letter.maxReplies > 1 ? LetterStatus.WAITING_CLAIM : LetterStatus.CLAIMED;
      case LetterEvent.RELEASED:
        return LetterStatus.WAITING_CLAIM;
      case LetterEvent.REPLIED:
        return LetterStatus.REPLIED;
      case LetterEvent.CLOSE:
        return LetterStatus.CLOSED;
      default:
        return current;
    }
  }

  // ---------- 配额 ----------
  private async assertWriteQuota(userId: bigint): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'DELETED' || user.status === 'BANNED') {
      throw new BusinessException(ApiCode.FORBIDDEN, '账号状态异常，无法投递');
    }
    if (user.status === 'WRITE_LIMITED') {
      throw new BusinessException(ApiCode.FORBIDDEN, '你的投递功能已被限制');
    }
    const key = `quota:write:${userId}:${dayStamp()}`;
    const used = Number((await this.redis.get(key)) ?? 0);
    if (used >= user.dailyWriteQuota) {
      throw new BusinessException(ApiCode.QUOTA_EXCEEDED, '今天的投信额度已用完，明天再来吧');
    }
  }

  private async consumeWriteQuota(userId: bigint): Promise<void> {
    const key = `quota:write:${userId}:${dayStamp()}`;
    await this.redis.incrWithTtl(key, secondsUntilEndOfDay());
  }

  private async assertIdempotent(userId: bigint, idemKey: string): Promise<void> {
    const key = `idem:letter:${userId}:${idemKey}`;
    const ok = await this.redis.acquireLock(key, 300);
    if (!ok) {
      throw new BusinessException(ApiCode.IDEMPOTENT_REPLAY, '请勿重复提交');
    }
  }
}
