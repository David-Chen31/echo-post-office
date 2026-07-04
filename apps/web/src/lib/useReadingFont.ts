'use client';

import { useCallback, useEffect, useState } from 'react';

export type ReadingFont = 'hand' | 'print';

const KEY = 'reading-font';

/**
 * 阅读字体偏好（手写/印刷），持久化到 localStorage。
 * 正文默认手写体；提供一键切印刷体作为可读性退路（§3）。
 */
export function useReadingFont(): { font: ReadingFont; toggle: () => void; set: (f: ReadingFont) => void } {
  const [font, setFont] = useState<ReadingFont>('hand');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(KEY)) as ReadingFont | null;
    if (saved === 'hand' || saved === 'print') setFont(saved);
  }, []);

  const set = useCallback((f: ReadingFont) => {
    setFont(f);
    try {
      window.localStorage.setItem(KEY, f);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => set(font === 'hand' ? 'print' : 'hand'), [font, set]);

  return { font, toggle, set };
}
