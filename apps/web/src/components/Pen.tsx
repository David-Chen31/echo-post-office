'use client';

/** 一支斜倚在信纸旁的钢笔（书桌点缀）。writing=true 时墨尖轻微律动。 */
export function Pen({ writing = false, className = '' }: { writing?: boolean; className?: string }) {
  return (
    <div className={className} aria-hidden>
      <svg width="120" height="30" viewBox="0 0 120 30" className={writing ? 'pen-writing' : ''} style={{ transformOrigin: '8px 22px' }}>
        {/* 笔杆 */}
        <g transform="rotate(-18 60 15)">
          <rect x="26" y="11" width="80" height="8" rx="4" fill="#3A3026" />
          <rect x="96" y="10.5" width="14" height="9" rx="3" fill="#A8453A" opacity="0.9" />
          {/* 笔握 */}
          <rect x="20" y="11.5" width="10" height="7" rx="2" fill="#8A7E6C" />
          {/* 笔尖 */}
          <path d="M20 15 L6 15 L14 11 M6 15 L14 19" fill="none" stroke="#5A4632" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M6 15 L12 13.5 L12 16.5 Z" fill="#5A4632" />
        </g>
      </svg>
    </div>
  );
}
