// 单一来源：与 prisma/schema.prisma 的 enum 保持一致。
// 前后端共享，避免漂移。

export const AccountType = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  WRITE_LIMITED: 'WRITE_LIMITED',
  REPLY_LIMITED: 'REPLY_LIMITED',
  BANNED: 'BANNED',
  DELETED: 'DELETED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserLevel = {
  NEWCOMER: 'NEWCOMER', // 初来投信人
  READER: 'READER', // 安静读信人
  REPLIER: 'REPLIER', // 温柔回信人
  KEEPER: 'KEEPER', // 长期守信人
} as const;
export type UserLevel = (typeof UserLevel)[keyof typeof UserLevel];

export const LetterCategory = {
  STUDY: 'STUDY',
  WORK: 'WORK',
  LOVE: 'LOVE',
  FAMILY: 'FAMILY',
  FRIENDSHIP: 'FRIENDSHIP',
  GROWTH: 'GROWTH',
  LONELINESS: 'LONELINESS',
  CONFUSION: 'CONFUSION',
  REGRET: 'REGRET',
  LIFE_STORY: 'LIFE_STORY',
  JUST_TALK: 'JUST_TALK',
  OTHER: 'OTHER',
} as const;
export type LetterCategory = (typeof LetterCategory)[keyof typeof LetterCategory];

export const Mood = {
  CALM: 'CALM',
  SAD: 'SAD',
  ANXIOUS: 'ANXIOUS',
  TIRED: 'TIRED',
  HOPEFUL: 'HOPEFUL',
  GRATEFUL: 'GRATEFUL',
  CONFUSED: 'CONFUSED',
  OTHER: 'OTHER',
} as const;
export type Mood = (typeof Mood)[keyof typeof Mood];

export const LetterStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_MODERATION: 'UNDER_MODERATION',
  WAITING_CLAIM: 'WAITING_CLAIM',
  CLAIMED: 'CLAIMED',
  REPLIED: 'REPLIED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
} as const;
export type LetterStatus = (typeof LetterStatus)[keyof typeof LetterStatus];

export const ClaimStatus = {
  CLAIMED: 'CLAIMED',
  REPLIED: 'REPLIED',
  EXPIRED: 'EXPIRED',
  RELEASED: 'RELEASED',
} as const;
export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const ReplyStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_MODERATION: 'UNDER_MODERATION',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
} as const;
export type ReplyStatus = (typeof ReplyStatus)[keyof typeof ReplyStatus];

export const RiskLevel = {
  NONE: 'NONE',
  LOW: 'LOW',
  HIGH: 'HIGH',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const ReplyFeedbackType = {
  UNDERSTOOD: 'UNDERSTOOD', // 被理解
  SERIOUS: 'SERIOUS', // 很认真
  HELPFUL: 'HELPFUL', // 有帮助
  AVERAGE: 'AVERAGE', // 一般
  UNCOMFORTABLE: 'UNCOMFORTABLE', // 不舒服
} as const;
export type ReplyFeedbackType = (typeof ReplyFeedbackType)[keyof typeof ReplyFeedbackType];

export const ReportTargetType = {
  LETTER: 'LETTER',
  REPLY: 'REPLY',
  USER: 'USER',
} as const;
export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType];

export const ReportReason = {
  HARASSMENT: 'HARASSMENT',
  ATTACK: 'ATTACK',
  PORN: 'PORN',
  AD_FRAUD: 'AD_FRAUD',
  ASK_CONTACT: 'ASK_CONTACT',
  DANGEROUS_ADVICE: 'DANGEROUS_ADVICE',
  PRIVACY_LEAK: 'PRIVACY_LEAK',
  OTHER: 'OTHER',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
} as const;
export type ReportPriority = (typeof ReportPriority)[keyof typeof ReportPriority];

export const ReportStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ModerationAction = {
  PASS: 'PASS',
  MASK_PASS: 'MASK_PASS',
  RETURN: 'RETURN',
  REJECT: 'REJECT',
  LIMIT: 'LIMIT',
  BAN: 'BAN',
  ESCALATE: 'ESCALATE',
} as const;
export type ModerationAction = (typeof ModerationAction)[keyof typeof ModerationAction];

export const SensitiveType = {
  PHONE: 'PHONE',
  WECHAT: 'WECHAT',
  EMAIL: 'EMAIL',
  ADDRESS: 'ADDRESS',
  ID_CARD: 'ID_CARD',
  BANK: 'BANK',
  SCHOOL_CLASS: 'SCHOOL_CLASS',
  COMPANY: 'COMPANY',
  ABUSE: 'ABUSE',
  HATE: 'HATE',
  AD: 'AD',
  FRAUD: 'FRAUD',
  SELF_HARM: 'SELF_HARM',
  VIOLENCE: 'VIOLENCE',
} as const;
export type SensitiveType = (typeof SensitiveType)[keyof typeof SensitiveType];

export const NotificationType = {
  REPLY_RECEIVED: 'REPLY_RECEIVED',
  MODERATION_RESULT: 'MODERATION_RESULT',
  CLAIM_EXPIRING: 'CLAIM_EXPIRING',
  CONVERSATION_REQUEST: 'CONVERSATION_REQUEST',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const ConversationStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
} as const;
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const ModTargetType = {
  LETTER: 'LETTER',
  REPLY: 'REPLY',
} as const;
export type ModTargetType = (typeof ModTargetType)[keyof typeof ModTargetType];
