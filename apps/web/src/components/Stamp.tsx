'use client';

/** 邮戳（圆形日期章，暗红）。用于卡片/拆信，适度点缀。 */
export function Stamp({ size = 64, label = '回声邮局' }: { size?: number; label?: string }) {
  const today = new Date();
  const date = `${today.getMonth() + 1}.${today.getDate()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="opacity-80" aria-hidden>
      <g fill="none" stroke="#A8453A" strokeWidth="2.5">
        <circle cx="50" cy="50" r="44" strokeDasharray="3 4" />
        <circle cx="50" cy="50" r="34" />
      </g>
      <text x="50" y="46" textAnchor="middle" fill="#A8453A" fontSize="13" fontFamily="serif">
        {label}
      </text>
      <text x="50" y="64" textAnchor="middle" fill="#A8453A" fontSize="15" fontFamily="serif">
        {date}
      </text>
    </svg>
  );
}
