import type { Config } from 'tailwindcss';

// 设计令牌来自《前端视觉与交互设计文档》§2
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // 令牌走 CSS 变量：昼/夜切换只改 globals.css 里的变量（§一 全站主题）
      colors: {
        paper: 'rgb(var(--c-paper) / <alpha-value>)', // 主背景（画布，昼夜翻转）
        paper2: 'rgb(var(--c-paper2) / <alpha-value>)', // 次背景
        letter: 'rgb(var(--c-letter) / <alpha-value>)', // 信纸面（始终被照亮的暖白）
        ink: 'rgb(var(--c-ink) / <alpha-value>)', // 正文墨褐（画布上夜里转浅）
        ink2: 'rgb(var(--c-ink2) / <alpha-value>)', // 次要文字
        stamp: 'rgb(var(--c-stamp) / <alpha-value>)', // 邮戳/强调 暗红
        glow: 'rgb(var(--c-glow) / <alpha-value>)', // 暖光
        line: 'rgb(var(--c-line) / <alpha-value>)', // 分隔/描边
        calm: 'rgb(var(--c-calm) / <alpha-value>)', // 平和 苔绿
      },
      fontFamily: {
        hand: ['var(--font-hand)', '"Ma Shan Zheng"', 'cursive'],
        print: ['var(--font-print)', '"Noto Serif SC"', 'serif'],
        ui: ['system-ui', '-apple-system', '"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 16px rgba(58,48,38,.08)',
        paper: '0 2px 10px rgba(58,48,38,.10)',
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%,100%': { opacity: '0.65' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        glow: 'glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
