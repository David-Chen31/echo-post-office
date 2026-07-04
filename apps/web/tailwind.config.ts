import type { Config } from 'tailwindcss';

// 设计令牌来自《前端视觉与交互设计文档》§2
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#F7F3EA', // 主背景 米白纸色
        paper2: '#EFE9DC', // 次背景 浅米灰
        letter: '#FBF8F1', // 信纸面
        ink: '#3A3026', // 正文墨褐
        ink2: '#8A7E6C', // 次要文字 淡墨
        stamp: '#A8453A', // 邮戳/强调 暗红
        glow: '#E8B86D', // 暖光
        line: '#D9CFBC', // 分隔/描边
        calm: '#7C8B6B', // 平和 苔绿
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
