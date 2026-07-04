import { Injectable } from '@nestjs/common';
import { ReplyStatus } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { fuzzyTime } from '../../common/utils/time-fuzz';

export interface SentLetterView {
  letterId: string;
  title: string | null;
  category: string;
  status: string;
  replyCount: number;
  createdAt: string;
}

export interface ReceivedReplyView {
  replyId: string;
  letterId: string;
  letterTitle: string | null;
  content: string;
  isFavorited: boolean;
  fuzzyTime: string;
}

export interface ReplyingView {
  claimId: string;
  letterId: string;
  letterTitle: string | null;
  content: string;
  expiresAt: string;
}

export interface DraftView {
  draftId: string;
  title: string | null;
  content: string;
  category: string | null;
  updatedAt: string;
}

@Injectable()
export class MailboxService {
  constructor(private readonly prisma: PrismaService) {}

  /** 我寄出的信。 */
  async sent(userId: bigint): Promise<SentLetterView[]> {
    const letters = await this.prisma.letter.findMany({
      where: { authorId: userId, status: { not: 'DRAFT' } },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { replies: { where: { status: ReplyStatus.PUBLISHED } } } } },
    });
    return letters.map((l) => ({
      letterId: l.id.toString(),
      title: l.title,
      category: l.category,
      status: l.status,
      replyCount: l._count.replies,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  /** 我收到的回信（仅已发布）。 */
  async received(userId: bigint): Promise<ReceivedReplyView[]> {
    const replies = await this.prisma.reply.findMany({
      where: { status: ReplyStatus.PUBLISHED, letter: { authorId: userId } },
      orderBy: { publishedAt: 'desc' },
      include: { letter: { select: { id: true, title: true } } },
    });
    return replies.map((r) => ({
      replyId: r.id.toString(),
      letterId: r.letter.id.toString(),
      letterTitle: r.letter.title,
      content: r.content,
      isFavorited: r.isFavorited,
      fuzzyTime: fuzzyTime(r.publishedAt ?? r.createdAt),
    }));
  }

  /** 我正在回复的信（已领取、未提交/未超时）。 */
  async replying(userId: bigint): Promise<ReplyingView[]> {
    const claims = await this.prisma.letterClaim.findMany({
      where: { readerId: userId, status: 'CLAIMED', expiresAt: { gt: new Date() } },
      orderBy: { claimedAt: 'desc' },
      include: { letter: { select: { id: true, title: true, content: true } } },
    });
    return claims.map((c) => ({
      claimId: c.id.toString(),
      letterId: c.letter.id.toString(),
      letterTitle: c.letter.title,
      content: c.letter.content,
      expiresAt: c.expiresAt.toISOString(),
    }));
  }

  /** 我收藏的回信。 */
  async favorites(userId: bigint): Promise<ReceivedReplyView[]> {
    const replies = await this.prisma.reply.findMany({
      where: { isFavorited: true, letter: { authorId: userId } },
      orderBy: { publishedAt: 'desc' },
      include: { letter: { select: { id: true, title: true } } },
    });
    return replies.map((r) => ({
      replyId: r.id.toString(),
      letterId: r.letter.id.toString(),
      letterTitle: r.letter.title,
      content: r.content,
      isFavorited: r.isFavorited,
      fuzzyTime: fuzzyTime(r.publishedAt ?? r.createdAt),
    }));
  }

  /** 我的草稿。 */
  async drafts(userId: bigint): Promise<DraftView[]> {
    const drafts = await this.prisma.letterDraft.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return drafts.map((d) => ({
      draftId: d.id.toString(),
      title: d.title,
      content: d.content,
      category: d.category,
      updatedAt: d.updatedAt.toISOString(),
    }));
  }
}
