import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '回声邮局 · 写一封信，寄给愿意认真读完的人',
  description: '一个让人认真写下一封信，并从陌生人那里收到温柔回应的匿名书信网站。',
};

export const viewport: Viewport = {
  themeColor: '#F7F3EA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 手写体(Ma Shan Zheng) + 印刷体(Noto Serif SC)，display=swap 先用系统字体顶上 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="mx-auto min-h-[100dvh] w-full max-w-[680px] px-5">{children}</div>
      </body>
    </html>
  );
}
