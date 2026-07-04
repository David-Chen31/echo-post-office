import { TIME_FUZZ } from '@letter/shared';

/**
 * 时间脱敏：阅读页只展示模糊时间，隐藏精确时间防身份推测（计划书要求）。
 */
export function fuzzyTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < TIME_FUZZ.JUST_NOW_MINUTES) return '刚刚';
  const hours = Math.floor(min / 60);
  if (hours < 1) return '不久前';
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return '很久以前';
}
