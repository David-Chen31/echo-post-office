export const QUEUE = {
  NOTIFICATION: 'notification',
  MODERATION: 'moderation',
  CLAIM_EXPIRE: 'claim-expire',
  STATS: 'stats',
} as const;
export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

export const JOB = {
  // notification queue
  SEND_NOTIFICATION: 'send-notification',
  // moderation queue
  AUTO_CHECK: 'auto-check',
  // claim-expire queue
  RELEASE_EXPIRED: 'release-expired',
  // stats queue
  AGGREGATE_DAILY: 'aggregate-daily',
} as const;
