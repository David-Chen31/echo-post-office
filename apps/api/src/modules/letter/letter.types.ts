import { Letter } from '@prisma/client';
import { fuzzyTime } from '../../common/utils/time-fuzz';

/** 信件状态机事件（advanceState 唯一入口的事件集）。 */
export const LetterEvent = {
  PUBLISH: 'PUBLISH', // 审核通过 -> WAITING_CLAIM
  TO_MODERATION: 'TO_MODERATION', // -> UNDER_MODERATION
  CLAIMED: 'CLAIMED', // 被领取
  RELEASED: 'RELEASED', // 领取释放 -> 回到 WAITING_CLAIM
  REPLIED: 'REPLIED', // 收到回信
  CLOSE: 'CLOSE', // 结束
  REJECT: 'REJECT', // 审核拒绝
} as const;
export type LetterEvent = (typeof LetterEvent)[keyof typeof LetterEvent];

/** 作者视角：我寄出的信（含精确状态）。 */
export interface LetterOwnerView {
  letterId: string;
  title: string | null;
  content: string;
  category: string;
  mood: string | null;
  status: string;
  maxReplies: number;
  createdAt: string;
  publishedAt: string | null;
}

/** 读者视角：阅读/领取页（脱敏：隐藏作者、精确时间）。 */
export interface LetterReaderView {
  letterId: string;
  title: string | null;
  salutation: string | null;
  content: string;
  signature: string | null;
  signedDate: string | null;
  category: string;
  mood: string | null;
  fuzzyTime: string;
}

export function toOwnerView(l: Letter): LetterOwnerView {
  return {
    letterId: l.id.toString(),
    title: l.title,
    content: l.content,
    category: l.category,
    mood: l.mood,
    status: l.status,
    maxReplies: l.maxReplies,
    createdAt: l.createdAt.toISOString(),
    publishedAt: l.publishedAt?.toISOString() ?? null,
  };
}

export function toReaderView(l: Letter): LetterReaderView {
  return {
    letterId: l.id.toString(),
    title: l.title,
    salutation: l.salutation,
    content: l.content,
    signature: l.signature,
    signedDate: l.signedDate,
    category: l.category,
    mood: l.mood,
    fuzzyTime: fuzzyTime(l.publishedAt ?? l.createdAt),
  };
}
