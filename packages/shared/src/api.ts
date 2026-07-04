// 统一 API 响应格式：{ code, data, message }

export interface ApiResponse<T> {
  /** 0 = 成功，非 0 = 业务错误码 */
  code: number;
  data: T | null;
  message: string;
}

export const ApiCode = {
  OK: 0,
  // 通用
  BAD_REQUEST: 1000,
  UNAUTHORIZED: 1001,
  FORBIDDEN: 1003,
  NOT_FOUND: 1004,
  RATE_LIMITED: 1029,
  CONFLICT: 1009,
  INTERNAL: 1500,
  // 业务
  LETTER_NOT_CLAIMABLE: 2001,
  CLAIM_EXPIRED: 2002,
  QUOTA_EXCEEDED: 2003,
  ALREADY_REPLIED: 2004,
  MODERATION_REJECTED: 2005,
  IDEMPOTENT_REPLAY: 2006,
} as const;
export type ApiCode = (typeof ApiCode)[keyof typeof ApiCode];

export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: ApiCode.OK, data, message };
}

export function fail(code: number, message: string): ApiResponse<null> {
  return { code, data: null, message };
}
