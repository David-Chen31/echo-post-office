import { z } from 'zod';
import { LIMITS } from './constants';
import {
  AccountType,
  LetterCategory,
  Mood,
  ReplyFeedbackType,
  ReportReason,
  ReportTargetType,
} from './enums';

// ---------- Auth ----------
export const sendCodeSchema = z.object({
  target: z.string().min(3).max(255),
  scene: z.enum(['register', 'login']),
});
export type SendCodeDto = z.infer<typeof sendCodeSchema>;

export const registerSchema = z.object({
  accountType: z.nativeEnum(AccountType),
  target: z.string().min(3).max(255), // email or phone
  code: z.string().length(6),
  nickname: z.string().min(1).max(LIMITS.NICKNAME_MAX_LENGTH),
  password: z.string().min(8).max(64).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  target: z.string().min(3).max(255),
  code: z.string().length(6).optional(),
  password: z.string().min(8).max(64).optional(),
}).refine((v) => v.code || v.password, {
  message: '需要验证码或密码',
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

// ---------- Letter ----------
export const replyPreferenceSchema = z.object({
  wantedReplyTypes: z.array(z.string()).default([]),
  allowMultiple: z.boolean().default(false),
  closeAfterFirstReply: z.boolean().default(true),
});
export type ReplyPreference = z.infer<typeof replyPreferenceSchema>;

export const letterDraftSchema = z.object({
  title: z.string().max(LIMITS.TITLE_MAX_LENGTH).optional(),
  content: z.string().max(LIMITS.LETTER_MAX_LENGTH),
  category: z.nativeEnum(LetterCategory).optional(),
  mood: z.nativeEnum(Mood).optional(),
});
export type LetterDraftDto = z.infer<typeof letterDraftSchema>;

export const submitLetterSchema = z.object({
  title: z.string().max(LIMITS.TITLE_MAX_LENGTH).optional(),
  content: z.string().min(LIMITS.LETTER_MIN_LENGTH).max(LIMITS.LETTER_MAX_LENGTH),
  // 决策 A：前端不再让用户选主题；省略时后端按“只是想说说”兜底。
  category: z.nativeEnum(LetterCategory).default(LetterCategory.JUST_TALK),
  mood: z.nativeEnum(Mood).optional(),
  replyPreference: replyPreferenceSchema.optional(),
  isPublic: z.boolean().default(false),
  maxReplies: z.number().int().min(1).max(LIMITS.MAX_REPLIES_CAP).default(1),
});
export type SubmitLetterDto = z.infer<typeof submitLetterSchema>;

// ---------- Reply ----------
export const replyDraftSchema = z.object({
  claimId: z.string(), // bigint as string over the wire
  content: z.string().max(LIMITS.REPLY_MAX_LENGTH),
});
export type ReplyDraftDto = z.infer<typeof replyDraftSchema>;

export const submitReplySchema = z.object({
  claimId: z.string(),
  content: z.string().min(LIMITS.REPLY_MIN_LENGTH).max(LIMITS.REPLY_MAX_LENGTH),
});
export type SubmitReplyDto = z.infer<typeof submitReplySchema>;

export const replyFeedbackSchema = z.object({
  type: z.nativeEnum(ReplyFeedbackType),
});
export type ReplyFeedbackDto = z.infer<typeof replyFeedbackSchema>;

// ---------- Report ----------
export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string(),
  reason: z.nativeEnum(ReportReason),
  description: z.string().max(1000).optional(),
});
export type CreateReportDto = z.infer<typeof createReportSchema>;

// ---------- User ----------
export const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(LIMITS.NICKNAME_MAX_LENGTH).optional(),
  interestedTopics: z.array(z.nativeEnum(LetterCategory)).optional(),
  blockedTopics: z.array(z.nativeEnum(LetterCategory)).optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const blockUserSchema = z.object({
  blockedId: z.string(),
});
export type BlockUserDto = z.infer<typeof blockUserSchema>;
