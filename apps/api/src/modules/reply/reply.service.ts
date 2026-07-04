import { Injectable } from '@nestjs/common';
import {
  ApiCode,
  ClaimStatus,
  ModTargetType,
  NotificationType,
  ReplyFeedbackType,
  ReplyStatus,
} from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { ModerationService } from '../moderation/moderation.service';
import { ClaimService } from '../claim/claim.service';
import { LetterService } from '../letter/letter.service';
import { LetterEvent } from '../letter/letter.types';
import { NotificationService } from '../notification/notification.service';
import { BusinessException } from '../../common/errors/business.exception';

export interface ReplySubmitView {
  replyId: string;
  status: string;
  /** 是否进入人工审核（高风险） */
  pendingModeration: boolean;
}

@Injectable()
export class ReplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly moderation: ModerationService,
    private readonly claims: ClaimService,
    private readonly letters: LetterService,
    private readonly notifications: NotificationService,
  ) {}

  /** 校验领取有效（属于本人、状态 CLAIMED、未超时），返回 claim。 */
  private async assertActiveClaim(writerId: bigint, claimId: bigint) {
    const claim = await this.prisma.letterClaim.findUnique({ where: { id: claimId } });
    if (!claim || claim.readerId !== writerId) {
      throw new BusinessException(ApiCode.NOT_FOUND, '领取记录不存在');
    }
    if (claim.status === ClaimStatus.REPLIED) {
      throw new BusinessException(ApiCode.ALREADY_REPLIED, '这封信你已经回复过了');
    }
    if (claim.status !== ClaimStatus.CLAIMED || claim.expiresAt.getTime() < Date.now()) {
      throw new BusinessException(ApiCode.CLAIM_EXPIRED, '领取已超时，信件已回到待领取池');
    }
    return claim;
  }

  async saveDraft(writerId: bigint, claimId: bigint, content: string): Promise<{ replyId: string }> {
    const claim = await this.assertActiveClaim(writerId, claimId);
    const reply = await this.prisma.reply.upsert({
      where: { claimId },
      create: {
        letterId: claim.letterId,
        claimId,
        writerId,
        content,
        status: ReplyStatus.DRAFT,
      },
      update: { content },
    });
    return { replyId: reply.id.toString() };
  }

  /**
   * 提交回信：自动检测 -> 高风险进人工审核；否则发布并通知原作者、推进信件状态。
   */
  async submit(
    writerId: bigint,
    claimId: bigint,
    content: string,
    idemKey?: string,
  ): Promise<ReplySubmitView> {
    if (idemKey) {
      const ok = await this.redis.acquireLock(`idem:reply:${writerId}:${idemKey}`, 300);
      if (!ok) throw new BusinessException(ApiCode.IDEMPOTENT_REPLAY, '请勿重复提交');
    }
    const claim = await this.assertActiveClaim(writerId, claimId);

    const reply = await this.prisma.reply.upsert({
      where: { claimId },
      create: {
        letterId: claim.letterId,
        claimId,
        writerId,
        content,
        status: ReplyStatus.SUBMITTED,
      },
      update: { content, status: ReplyStatus.SUBMITTED },
    });

    const check = await this.moderation.autoCheck({
      type: ModTargetType.REPLY,
      id: reply.id,
      content,
    });

    if (check.needsManual) {
      await this.prisma.reply.update({
        where: { id: reply.id },
        data: { content: check.maskedContent, riskLevel: check.riskLevel, status: ReplyStatus.UNDER_MODERATION },
      });
      return { replyId: reply.id.toString(), status: ReplyStatus.UNDER_MODERATION, pendingModeration: true };
    }

    // 发布
    await this.prisma.reply.update({
      where: { id: reply.id },
      data: {
        content: check.maskedContent,
        riskLevel: check.riskLevel,
        status: ReplyStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    await this.claims.markReplied(claimId);
    await this.letters.advanceState(claim.letterId, LetterEvent.REPLIED);

    const letter = await this.prisma.letter.findUniqueOrThrow({ where: { id: claim.letterId } });
    await this.notifications.push(letter.authorId, NotificationType.REPLY_RECEIVED, {
      letterId: letter.id.toString(),
      message: '你的信箱里有一封新来信。',
    });

    return { replyId: reply.id.toString(), status: ReplyStatus.PUBLISHED, pendingModeration: false };
  }

  /** 收信人对回信的质量反馈（不公开），并微调回信者信任分。 */
  async giveFeedback(raterId: bigint, replyId: bigint, type: ReplyFeedbackType): Promise<{ ok: boolean }> {
    const reply = await this.prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) throw new BusinessException(ApiCode.NOT_FOUND, '回信不存在');
    const letter = await this.prisma.letter.findUniqueOrThrow({ where: { id: reply.letterId } });
    if (letter.authorId !== raterId) {
      throw new BusinessException(ApiCode.FORBIDDEN, '只有收信人可以评价这封回信');
    }

    await this.prisma.replyFeedback.upsert({
      where: { replyId_raterId: { replyId, raterId } },
      create: { replyId, raterId, type },
      update: { type },
    });

    const delta = this.feedbackScoreDelta(type);
    if (delta !== 0) {
      await this.prisma.user.update({
        where: { id: reply.writerId },
        data: { trustScore: { increment: delta } },
      });
    }
    return { ok: true };
  }

  private feedbackScoreDelta(type: ReplyFeedbackType): number {
    switch (type) {
      case ReplyFeedbackType.UNDERSTOOD:
      case ReplyFeedbackType.HELPFUL:
        return 3;
      case ReplyFeedbackType.SERIOUS:
        return 2;
      case ReplyFeedbackType.UNCOMFORTABLE:
        return -3;
      default:
        return 0;
    }
  }

  /** 收藏回信（仅收信人）。 */
  async favorite(userId: bigint, replyId: bigint): Promise<{ ok: boolean }> {
    const reply = await this.prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) throw new BusinessException(ApiCode.NOT_FOUND, '回信不存在');
    const letter = await this.prisma.letter.findUniqueOrThrow({ where: { id: reply.letterId } });
    if (letter.authorId !== userId) {
      throw new BusinessException(ApiCode.FORBIDDEN, '无权操作');
    }
    await this.prisma.reply.update({ where: { id: replyId }, data: { isFavorited: true } });
    return { ok: true };
  }
}
