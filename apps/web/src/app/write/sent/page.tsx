'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Stamp } from '@/components/Stamp';

export default function SentPage() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1700);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center pb-16 text-center">
      <div className="relative h-[200px] w-[280px]">
        {/* 信封 */}
        <motion.svg
          viewBox="0 0 280 180"
          className="absolute inset-0"
          initial={{ y: 0 }}
          animate={done ? { y: -18, opacity: 0.35 } : { y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <rect x="10" y="30" width="260" height="150" rx="10" fill="#FBF8F1" stroke="#D9CFBC" strokeWidth="2" />
          {/* 封盖合上 */}
          <motion.path
            d="M10 35 L140 120 L270 35 Z"
            fill="#F2ECDE"
            stroke="#D9CFBC"
            strokeWidth="2"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </motion.svg>

        {/* 邮戳盖下 */}
        <motion.div
          className="absolute right-6 top-2"
          initial={{ scale: 1.6, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ duration: 0.4, delay: 0.85, type: 'spring', stiffness: 200 }}
        >
          <Stamp size={66} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={done ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mt-6 px-8"
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
