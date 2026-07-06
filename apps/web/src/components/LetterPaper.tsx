'use client';

import { ReadingFont } from '@/lib/useReadingFont';

/**
 * 信纸：暖白底 + 横线纹理。用于阅读与展示信件正文。
 * 正文按 readingFont 在手写/印刷间切换（可读性退路 §3）。
 */
export function LetterPaper({
  children,
  font = 'hand',
  className = '',
  withLines = true,
}: {
  children: React.ReactNode;
  font?: ReadingFont;
  className?: string;
  withLines?: boolean;
}) {
  return (
    <div className={`card paper-grain relative overflow-hidden bg-letter px-6 py-6 ${className}`}>
      <div className={`letter-body ${withLines ? 'ruled-bg' : ''}`} data-font={font}>
        {children}
      </div>
    </div>
  );
}

/** 把纯文本按空行/换行渲染为段落。 */
export function LetterText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{1,}/).filter((p) => p.trim().length > 0);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}
