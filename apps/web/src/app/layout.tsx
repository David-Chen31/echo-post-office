import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SceneBackdrop } from '@/components/SceneBackdrop';
import { AmbienceControls } from '@/components/AmbienceControls';

// 首屏前同步定好 data-theme，避免夜晚闪一下白天
const noFlashTheme = `(function(){try{var s=localStorage.getItem('site-theme');var h=new Date().getHours();var t=(s==='day'||s==='night')?s:((h>=18||h<6)?'night':'day');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

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
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        {/* 手写体自托管于 /public/fonts（见 globals.css @font-face），不再依赖 Google Fonts */}
        <link rel="preload" href="/fonts/MaShanZheng-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <SceneBackdrop />
          <div className="mx-auto min-h-[100dvh] w-full max-w-[680px] px-5">{children}</div>
          <AmbienceControls />
        </ThemeProvider>
      </body>
    </html>
  );
}
