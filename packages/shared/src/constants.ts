// 业务常量：默认限额、领取时限、字数等。前后端共享。

export const LIMITS = {
  /** 新用户每日投递信件上限 */
  DEFAULT_DAILY_WRITE_QUOTA: 1,
  /** 新用户每日领取上限 */
  DEFAULT_DAILY_CLAIM_QUOTA: 2,
  /** 单封信默认最多回信数 */
  DEFAULT_MAX_REPLIES: 1,
  MAX_REPLIES_CAP: 3,
  /** 信件正文最低字数（柔性提示，后端按此校验下限） */
  LETTER_MIN_LENGTH: 50,
  LETTER_MAX_LENGTH: 5000,
  /** 回信正文长度 */
  REPLY_MIN_LENGTH: 30,
  REPLY_MAX_LENGTH: 5000,
  TITLE_MAX_LENGTH: 60,
  NICKNAME_MAX_LENGTH: 32,
  /** 领取时限（小时） */
  CLAIM_EXPIRE_HOURS: 24,
} as const;

export const TRUST = {
  INITIAL_SCORE: 100,
  /** 等级阈值（trustScore 维度，可与有效回信数共同决定） */
  LEVEL_THRESHOLDS: {
    NEWCOMER: 0,
    READER: 80,
    REPLIER: 120,
    KEEPER: 200,
  },
} as const;

/** 阅读页时间脱敏阈值 */
export const TIME_FUZZ = {
  JUST_NOW_MINUTES: 5,
} as const;

/** content_configs 的固定 key */
export const CONFIG_KEYS = {
  HOME_HERO: 'home.hero',
  COMMUNITY_RULES: 'community.rules',
  RISK_NOTICE: 'risk.notice',
  EMERGENCY_NOTICE: 'emergency.notice',
  REPLY_GUIDE: 'reply.guide',
} as const;
