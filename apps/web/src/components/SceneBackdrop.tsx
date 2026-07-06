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
      {/* 月：圆形，但有月海/环形山与明暗交界，带柔光晕 */}
      <div className="absolute" style={{ right: '12%', top: '7%', filter: 'drop-shadow(0 0 30px rgba(240,230,190,0.3))' }}>
        <svg width="62" height="62" viewBox="0 0 60 60" aria-hidden>
          <defs>
            <radialGradient id="moonBody" cx="38%" cy="34%" r="74%">
              <stop offset="0%" stopColor="#fdf7e6" />
              <stop offset="60%" stopColor="#efe1bd" />
              <stop offset="100%" stopColor="#d7c396" />
            </radialGradient>
            <radialGradient id="moonShade" cx="72%" cy="72%" r="62%">
              <stop offset="0%" stopColor="rgba(96,84,56,0)" />
              <stop offset="100%" stopColor="rgba(84,72,48,0.32)" />
            </radialGradient>
            <clipPath id="moonClip">
              <circle cx="30" cy="30" r="28" />
            </clipPath>
          </defs>
          <circle cx="30" cy="30" r="28" fill="url(#moonBody)" />
          {/* 环形山 / 月海 */}
          <g clipPath="url(#moonClip)" fill="#d3c091">
            <circle cx="22" cy="19" r="4" opacity="0.6" />
            <circle cx="38.5" cy="31" r="6.2" opacity="0.5" />
            <circle cx="25.5" cy="40" r="3" opacity="0.55" />
            <circle cx="42" cy="17" r="2.3" opacity="0.5" />
            <circle cx="33" cy="46" r="2" opacity="0.45" />
          </g>
          {/* 明暗交界 */}
          <circle cx="30" cy="30" r="28" fill="url(#moonShade)" />
        </svg>
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
