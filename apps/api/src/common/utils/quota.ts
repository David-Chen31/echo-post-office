/** 当日剩余秒数，用于配额 key 的 TTL。 */
export function secondsUntilEndOfDay(now: Date = new Date()): number {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 1000));
}

export function dayStamp(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}
