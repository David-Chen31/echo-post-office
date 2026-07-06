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
        {/* 手写体自托管于 /public/fonts（见 globals.css @font-face），不再依赖 Google Fonts */}
        <link rel="preload" href="/fonts/MaShanZheng-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="mx-auto min-h-[100dvh] w-full max-w-[680px] px-5">{children}</div>
      </body>
    </html>
  );
}
