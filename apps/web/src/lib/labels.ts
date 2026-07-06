import { LetterCategory, Mood } from '@letter/shared';

export const CATEGORY_LABELS: Record<string, string> = {
  [LetterCategory.STUDY]: '学业',
  [LetterCategory.WORK]: '工作',
  [LetterCategory.LOVE]: '感情',
  [LetterCategory.FAMILY]: '家庭',
  [LetterCategory.FRIENDSHIP]: '友情',
  [LetterCategory.GROWTH]: '自我成长',
  [LetterCategory.LONELINESS]: '孤独',
  [LetterCategory.CONFUSION]: '迷茫',
  [LetterCategory.REGRET]: '遗憾',
  [LetterCategory.LIFE_STORY]: '生活故事',
  [LetterCategory.JUST_TALK]: '只是想说说',
  [LetterCategory.OTHER]: '其他',
};

export const MOOD_LABELS: Record<string, string> = {
  [Mood.CALM]: '平静',
  [Mood.SAD]: '低落',
  [Mood.ANXIOUS]: '焦虑',
  [Mood.TIRED]: '疲惫',
  [Mood.HOPEFUL]: '抱有期待',
  [Mood.GRATEFUL]: '感激',
  [Mood.CONFUSED]: '困惑',
  [Mood.OTHER]: '说不清',
};

// 用户等级：给一套温柔的中文称呼，避免把原始枚举（NEWCOMER…）直接摊给用户
export const LEVEL_LABELS: Record<string, string> = {
  NEWCOMER: '刚来的人',
  READER: '愿意读信的人',
  REPLIER: '会认真回信的人',
  KEEPER: '守着这间邮局的人',
};

export const LETTER_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: '已投递',
  UNDER_MODERATION: '审核中',
  WAITING_CLAIM: '等待领取',
  CLAIMED: '已被领取',
  REPLIED: '已收到回信',
  CLOSED: '已结束',
  REJECTED: '未通过',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const MOOD_OPTIONS = Object.entries(MOOD_LABELS).map(([value, label]) => ({
  value,
  label,
}));
