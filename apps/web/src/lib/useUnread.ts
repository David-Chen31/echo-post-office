'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, NotificationItem } from './api';

/**
 * 未读通知计数：登录态下每 30s 轮询一次（MVP 不上 WebSocket）。
 * enabled=false（未登录）时完全静默，不发请求、计数恒为 0。
 */
export function useUnread(enabled = true): {
  count: number;
  refresh: () => void;
  markAllRead: () => Promise<void>;
} {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const refresh = useCallback(() => {
    if (!enabled) return;
    api
      .get<NotificationItem[]>('/notifications')
      .then(setItems)
      .catch(() => setItems([]));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [enabled, refresh]);

  const markAllRead = useCallback(async () => {
    const ids = items.map((n) => n.id);
    if (ids.length === 0) return;
    try {
      await api.post('/notifications/read', { ids });
      setItems([]);
    } catch {
      /* ignore */
    }
  }, [items]);

  return { count: items.length, refresh, markAllRead };
}
