'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Stamp } from '@/components/Stamp';

/**
 * 寄信仪式（§4.2）：信纸折叠 → 装入信封 → 封盖合上 → 盖邮戳 → 信封寄出飞走。
 * 用一个 step 状态机推进，每一步驱动对应元素的动效。reduce-motion 下由全局 CSS 降为瞬时。
 */
export default function SentPage() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500), // 折叠
      setTimeout(() => setStep(2), 1150), // 入封 + 封盖合上
      setTimeout(() => setStep(3), 1800), // 盖邮戳
      setTimeout(() => setStep(4), 2550), // 寄出飞走
      setTimeout(() => setStep(5), 3250), // 落地文案
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  const done = step >= 5;

  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center pb-16 text-center">
      <div className="relative h-[240px] w-[300px]">
        <motion.svg
          viewBox="0 0 300 240"
          className="absolute inset-0 w-full drop-shadow-[0_10px_24px_rgba(58,48,38,0.14)]"
          animate={step >= 4 ? { y: -280, opacity: 0, rotate: -6 } : { y: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: 'easeIn' }}
        >
          {/* 信封底 */}
          <rect x="20" y="78" width="260" height="140" rx="10" fill="#FBF8F1" stroke="#D9CFBC" strokeWidth="2" />

          {/* 信纸：先在信封上方摊开，随后折叠并滑入 */}
          <motion.g
            style={{ transformOrigin: '150px 70px' }}
            initial={{ y: -48, scaleY: 1, opacity: 1 }}
            animate={
              step === 0
                ? { y: -48, scaleY: 1, opacity: 1 }
                : { y: 14, scaleY: 0.32, opacity: 1 }
            }
            transition={{ duration: 0.55, ease: 'easeInOut' }}
          >
            <rect x="54" y="18" width="192" height="120" rx="4" fill="#FFFDF7" stroke="#E4D9C2" strokeWidth="1.5" />
            <line x1="72" y1="44" x2="228" y2="44" stroke="#E0D4BC" strokeWidth="2" />
            <line x1="72" y1="64" x2="228" y2="64" stroke="#E0D4BC" strokeWidth="2" />
            <line x1="72" y1="84" x2="228" y2="84" stroke="#E0D4BC" strokeWidth="2" />
            <line x1="72" y1="104" x2="190" y2="104" stroke="#E0D4BC" strokeWidth="2" />
          </motion.g>

          {/* 封盖：从顶边合下，盖住折好的信纸 */}
          <motion.path
            d="M20 82 L150 150 L280 82 Z"
            fill="#F2ECDE"
            stroke="#D9CFBC"
            strokeWidth="2"
            style={{ transformOrigin: '150px 82px' }}
            initial={{ scaleY: 0, opacity: 0.5 }}
            animate={step >= 2 ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0.5 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.svg>

        {/* 邮戳：盖章落下 */}
        <motion.div
          className="absolute right-5 top-9"
          initial={{ scale: 1.7, opacity: 0, rotate: -14 }}
          animate={
            step >= 3 && step < 4
              ? { scale: 1, opacity: 1, rotate: -8 }
              : step >= 4
                ? { scale: 1, opacity: 0, rotate: -8, y: -280 }
                : { scale: 1.7, opacity: 0, rotate: -14 }
          }
          transition={{ type: 'spring', stiffness: 220, damping: 12 }}
        >
          <Stamp size={62} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={done ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mt-4 px-8"
      >
        <p className="font-hand text-[24px] leading-relaxed text-ink">
          你的信已经寄出，
          <br />
          正在等待一个愿意认真读它的人。
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/mailbox" className="btn-primary w-full py-3.5">
            去我的信箱看看
          </Link>
          <Link href="/read" className="btn-ghost w-full py-3.5">
            也读一封别人的信
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
