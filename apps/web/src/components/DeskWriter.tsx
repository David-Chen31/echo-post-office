'use client';

import { motion } from 'framer-motion';

/**
 * 趴桌写信的氛围动画（§5.1 克制精致）：
 * 一个人伏案，台灯暖光极慢呼吸，笔尖轻微移动。
 * 2D SVG + 缓慢循环，低 CPU；reduce-motion 下由 CSS 降为静态。
 */
export function DeskWriter({ className = '' }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 320 200" className="h-auto w-full" role="img">
        {/* 暖光晕 */}
        <motion.ellipse
          cx="210"
          cy="70"
          rx="95"
          ry="60"
          fill="#E8B86D"
          opacity="0.18"
          animate={{ opacity: [0.12, 0.24, 0.12] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* 桌面 */}
        <rect x="0" y="150" width="320" height="50" fill="#EFE9DC" />
        <line x1="0" y1="150" x2="320" y2="150" stroke="#D9CFBC" strokeWidth="2" />

        {/* 台灯 */}
        <g stroke="#8A7E6C" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M250 150 L250 110" />
          <path d="M250 110 L210 80" />
        </g>
        <path d="M196 64 L232 64 L224 86 L204 86 Z" fill="#A8453A" opacity="0.85" />

        {/* 信纸 */}
        <g>
          <rect x="90" y="128" width="74" height="40" rx="3" fill="#FBF8F1" stroke="#D9CFBC" />
          <line x1="98" y1="140" x2="150" y2="140" stroke="#D9CFBC" strokeWidth="1.5" />
          <line x1="98" y1="148" x2="156" y2="148" stroke="#D9CFBC" strokeWidth="1.5" />
          <line x1="98" y1="156" x2="140" y2="156" stroke="#D9CFBC" strokeWidth="1.5" />
        </g>

        {/* 伏案的人（剪影） */}
        <g fill="#3A3026">
          <circle cx="150" cy="96" r="16" />
          <path d="M120 150 q30 -42 70 -34 q18 4 22 34 Z" />
        </g>
        {/* 手臂 + 笔，笔尖轻微移动 */}
        <motion.g
          fill="#3A3026"
          style={{ transformOrigin: '150px 132px' }}
          animate={{ rotate: [0, 1.6, -0.6, 0], x: [0, 3, 1, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M150 120 q-10 8 -22 18 l6 6 q14 -8 22 -16 Z" />
          <rect x="120" y="138" width="14" height="3" rx="1.5" fill="#A8453A" transform="rotate(35 127 139)" />
        </motion.g>
      </svg>
    </div>
  );
}
