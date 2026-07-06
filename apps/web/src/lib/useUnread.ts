'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, NotificationItem } from './api';

/**
 * 未读通知计数：登录态下每 30s 轮询一次（MVP 不上 WebSocket）。
 * 未登录时静默为 0。
 */
export function useUnread(): { count: number; refresh: () => void; markAllRead: () => Promise<void> } {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const refresh = useCallback(() => {
    api
      .get<NotificationItem[]>('/notifications')
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

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
