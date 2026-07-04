import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export interface RateLimitOptions {
  /** 时间窗口（秒） */
  windowSec: number;
  /** 窗口内最大请求数 */
  max: number;
}
/** 接口级限流（Redis 固定窗口）。 */
export const RateLimit = (opts: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, opts);
