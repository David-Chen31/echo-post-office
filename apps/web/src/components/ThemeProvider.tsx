'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'day' | 'night';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'day',
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeCtx);

/** 全站昼/夜主题：入夜自动、手动可切、记忆偏好；配合 <head> 内联脚本避免首屏闪烁。 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('day');

  useEffect(() => {
    // 与 layout 内联脚本已写入的 data-theme 对齐，避免水合不一致
    const cur = document.documentElement.getAttribute('data-theme');
    if (cur === 'night' || cur === 'day') {
      setTheme(cur);
      return;
    }
    const h = new Date().getHours();
    setTheme(h >= 18 || h < 6 ? 'night' : 'day');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'day' ? 'night' : 'day';
      try {
        localStorage.setItem('site-theme', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
