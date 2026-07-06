'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * 全站场景背景（§一 真实夜景）：
 * 夜 = 冷调靛蓝夜空（星点缓慢闪烁 + 一轮柔光的月）→ 房间更暗，
 *      信纸上方一圈台灯暖光池，四周 vignette 渐暗——冷暗与暖光的反差才像"夜"。
 * 昼 = 交给 body 的暖窗光，这里不额外绘制。
 */
export function SceneBackdrop() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 星点（仅客户端生成，避免水合不一致）
  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 52,
        size: Math.random() * 1.6 + 0.6,
        delay: Math.random() * 5,
        dur: 3 + Math.random() * 4,
        twinkle: Math.random() > 0.45,
      })),
    [],
  );

  if (theme !== 'night') return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 夜空 → 房间 */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0f1426 0%, #131a2e 44%, #0b0e18 100%)' }}
      />
      {/* 星点 */}
      {mounted &&
        stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: '#dfe6ff',
              opacity: 0.5,
              animation: s.twinkle ? `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` : undefined,
            }}
          />
        ))}
      {/* 月 + 光晕 */}
      <div className="absolute" style={{ right: '12%', top: '7%' }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '9999px',
            background: 'radial-gradient(circle at 38% 36%, #fdf6e3, #f1e4bf 58%, #e4d3a0)',
            boxShadow: '0 0 56px 22px rgba(240, 230, 190, 0.16)',
          }}
        />
      </div>
      {/* 台灯暖光池（信纸上方） */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(44% 40% at 50% 30%, rgba(246, 206, 128, 0.22), transparent 62%)' }}
      />
      {/* 四周渐暗 */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(130% 120% at 50% 42%, transparent 36%, rgba(5, 7, 13, 0.72) 100%)' }}
      />
    </div>
  );
}
