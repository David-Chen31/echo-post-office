import { Injectable } from '@nestjs/common';
import {
  ApiCode,
  ClaimStatus,
  LetterStatus,
  ModerationAction,
  ModTargetType,
  NotificationType,
  ReplyStatus,
  ReportStatus,
  RiskLevel,
} from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { LetterService } from '../letter/letter.service';
import { LetterEvent } from '../letter/letter.types';
import { ClaimService } from '../claim/claim.service';
import { NotificationService } from '../notification/notification.service';
import { BusinessException } from '../../common/errors/business.exception';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
    private readonly letters: LetterService,
    private readonly claims: ClaimService,
    private readonly notifications: NotificationService,
  ) {}

  // ---------- 数据看板 ----------
  async dashboard(): Promise<Record<string, number>> {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const [
      totalUsers,
      newUsers,
      activeUsers,
      newLetters,
      waitingLetters,
      repliedLetters,
      pendingModeration,
      highRisk,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: { not: 'DELETED' } } }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: since } } }),
      this.prisma.letter.count({ where: { createdAt: { gte: since } } }),
      this.prisma.letter.count({ where: { status: LetterStatus.WAITING_CLAIM } }),
      this.prisma.letter.count({ where: { status: LetterStatus.REPLIED } }),
      this.prisma.letter.count({ where: { status: LetterStatus.UNDER_MODERATION } }),
      this.prisma.letter.count({ where: { riskLevel: RiskLevel.HIGH } }),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    ]);
    return {
      totalUsers,
      newUsers,
      activeUsers,
      newLetters,
      waitingLetters,
      repliedLetters,
      pendingModeration,
      highRisk,
      pendingReports,
    };
  }

  // ---------- 审核队列 ----------
  async listLetters(status?: string, risk?: string): Promise<unknown[]> {
    const rows = await this.prisma.letter.findMany({
      where: {
        ...(status ? { status: status as LetterStatus } : { status: LetterStatus.UNDER_MODERATION }),
        ...(risk ? { riskLevel: risk as RiskLevel } : {}),
      },
      orderBy: [{ riskLevel: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    });
    const ids = rows.map((r) => r.id);
    const hits = await this.prisma.sensitiveHit.findMany({
      where: { targetType: ModTargetType.LETTER, targetId: { in: ids } },
    });
    return rows.map((l) => ({
      letterId: l.id.toString(),
      authorId: l.authorId.toString(),
      title: l.title,
      content: l.content,
      category: l.category,
      status: l.status,
      riskLevel: l.riskLevel,
      createdAt: l.createdAt.toISOString(),
      hits: hits
        .filter((h) => h.targetId === l.id)
        .map((h) => ({ type: h.type, matched: h.matched })),
    }));
  }

  async listReplies(status?: string): Promise<unknown[]> {
    const rows = await this.prisma.reply.findMany({
      where: { status: (status as ReplyStatus) ?? ReplyStatus.UNDER_MODERATION },
      orderBy: [{ riskLevel: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    });
    return rows.map((r) => ({
      replyId: r.id.toString(),
      letterId: r.letterId.toString(),
      writerId: r.writerId.toString(),
      content: r.content,
      status: r.status,
      riskLevel: r.riskLevel,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async reviewLetter(
    operatorId: bigint,
    letterId: bigint,
    action: ModerationAction,
    note?: string,
  ): Promise<{ ok: boolean; status: string }> {
    const letter = await this.prisma.letter.findUnique({ where: { id: letterId } });
    if (!letter) throw new BusinessException(ApiCode.NOT_FOUND, '信件不存在');

    let next: LetterStatus = letter.status as LetterStatus;
    if (action === ModerationAction.PASS || action === ModerationAction.MASK_PASS) {
      next = LetterStatus.WAITING_CLAIM;
      await this.prisma.letter.update({
        where: { id: letterId },
        data: { status: next, publishedAt: letter.publishedAt ?? new Date(), riskLevel: RiskLevel.LOW },
      });
    } else if (action === ModerationAction.REJECT) {
      next = LetterStatus.REJECTED;
      await this.prisma.letter.update({ where: { id: letterId }, data: { status: next } });
      await this.notifications.push(letter.authorId, NotificationType.MODERATION_RESULT, {
        message: '很抱歉，你的一封信未能通过审核。',
      });
    } else if (action === ModerationAction.RETURN) {
      next = LetterStatus.DRAFT;
      await this.prisma.letter.update({ where: { id: letterId }, data: { status: next } });
      await this.notifications.push(letter.authorId, NotificationType.MODERATION_RESULT, {
        message: '你的一封信需要修改后重新投递。',
      });
    }

    await this.moderation.review(
      operatorId,
      { type: ModTargetType.LETTER, id: letterId, content: letter.content },
      action,
      note,
    );
    return { ok: true, status: next };
  }

  async reviewReply(
    operatorId: bigint,
    replyId: bigint,
    action: ModerationAction,
    note?: string,
  ): Promise<{ ok: boolean; status: string }> {
    const reply = await this.prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) throw new BusinessException(ApiCode.NOT_FOUND, '回信不存在');

    let next: ReplyStatus = reply.status as ReplyStatus;
    if (action === ModerationAction.PASS || action === ModerationAction.MASK_PASS) {
      next = ReplyStatus.PUBLISHED;
      await this.prisma.reply.update({
        where: { id: replyId },
        data: { status: next, publishedAt: new Date(), riskLevel: RiskLevel.LOW },
      });
      await this.claims.markReplied(reply.claimId);
      await this.letters.advanceState(reply.letterId, LetterEvent.REPLIED);
      const letter = await this.prisma.letter.findUniqueOrThrow({ where: { id: reply.letterId } });
      await this.notifications.push(letter.authorId, NotificationType.REPLY_RECEIVED, {
        letterId: letter.id.toString(),
        message: '你的信箱里有一封新来信。',
      });
    } else if (action === ModerationAction.REJECT) {
      next = ReplyStatus.REJECTED;
      await this.prisma.reply.update({ where: { id: replyId }, data: { status: next } });
      await this.notifications.push(reply.writerId, NotificationType.MODERATION_RESULT, {
        message: '很抱歉，你的一封回信未能通过审核。',
      });
    }

    await this.moderation.review(
      operatorId,
      { type: ModTargetType.REPLY, id: replyId, content: reply.content },
      action,
      note,
    );
    return { ok: true, status: next };
  }

  // ---------- 举报处理 ----------
  async listReports(status?: string, priority?: string): Promise<unknown[]> {
    const rows = await this.prisma.report.findMany({
      where: {
        ...(status ? { status: status as ReportStatus } : { status: ReportStatus.PENDING }),
        ...(priority ? { priority: priority as never } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    });
    return rows.map((r) => ({
      reportId: r.id.toString(),
      targetType: r.targetType,
      targetId: r.targetId.toString(),
      reason: r.reason,
      description: r.description,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async handleReport(
    operatorId: bigint,
    reportId: bigint,
    status: ReportStatus,
    note?: string,
  ): Promise<{ ok: boolean }> {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new BusinessException(ApiCode.NOT_FOUND, '举报不存在');
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status, handledById: operatorId, handledAt: new Date(), description: note ?? report.description },
    });
    return { ok: true };
  }

  // ---------- 用户管理 ----------
  async getUserDetail(userId: bigint): Promise<unknown> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BusinessException(ApiCode.NOT_FOUND, '用户不存在');
    const [letterCount, replyCount, reportsAgainst] = await Promise.all([
      this.prisma.letter.count({ where: { authorId: userId } }),
      this.prisma.reply.count({ where: { writerId: userId } }),
      this.prisma.report.count({ where: { targetType: 'USER', targetId: userId } }),
    ]);
    return {
      userId: user.id.toString(),
      nickname: user.nickname,
      status: user.status,
      role: user.role,
      level: user.level,
      trustScore: user.trustScore,
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt.toISOString(),
      letterCount,
      replyCount,
      reportsAgainst,
    };
  }

  async limitUser(userId: bigint, kind: 'write' | 'reply'): Promise<{ ok: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: kind === 'write' ? 'WRITE_LIMITED' : 'REPLY_LIMITED' },
    });
    return { ok: true };
  }

  async banUser(userId: bigint): Promise<{ ok: boolean }> {
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });
    return { ok: true };
  }

  async restoreUser(userId: bigint): Promise<{ ok: boolean }> {
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    return { ok: true };
  }

  // ---------- 内容配置 ----------
  async getConfig(key: string): Promise<unknown> {
    const cfg = await this.prisma.contentConfig.findUnique({ where: { key } });
    return cfg ? { key: cfg.key, value: cfg.value } : { key, value: null };
  }

  async setConfig(key: string, value: unknown): Promise<{ ok: boolean }> {
    await this.prisma.contentConfig.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object },
    });
    return { ok: true };
  }
}
