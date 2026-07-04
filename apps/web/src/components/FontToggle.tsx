'use client';

import { ReadingFont } from '@/lib/useReadingFont';

/** 阅读字体切换：手写 / 印刷（§3 可读性退路），常驻阅读页。 */
export function FontToggle({ font, onToggle }: { font: ReadingFont; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1 rounded-full border border-line bg-letter px-3 py-1.5
                 font-ui text-[13px] text-ink2 transition-colors hover:text-stamp"
      aria-label="切换阅读字体"
      title={font === 'hand' ? '切换为印刷体（更易读）' : '切换为手写体'}
    >
      <span className="text-[15px] leading-none">Aa</span>
      <span>{font === 'hand' ? '手写' : '印刷'}</span>
    </button>
  );
}
