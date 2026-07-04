'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DeskWriter } from '@/components/DeskWriter';
import { BottomNav } from '@/components/BottomNav';
import { api } from '@/lib/api';

interface Hero {
  title: string;
  subtitle: string;
}

export default function HomePage() {
  const [hero, setHero] = useState<Hero>({
    title: '有些话，不知道该说给谁听。',
    subtitle: '把它写成一封信，寄给一个愿意认真读完的人。',
  });

  useEffect(() => {
    api
      .get<{ key: string; value: Hero }>('/configs/home.hero')
      .then((r) => r.value && setHero(r.value))
      .catch(() => {
        /* 用默认文案兜底 */
      });
  }, []);

  return (
    <main className="pb-24">
      {/* 氛围动画 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="pt-8"
      >
        <DeskWriter className="mx-auto max-w-[300px]" />
      </motion.div>

      {/* 情绪钩子 */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-4 text-center"
      >
        <h1 className="font-hand text-[30px] leading-[1.5] text-ink">{hero.title}</h1>
        <p className="mt-3 font-print text-[16px] leading-relaxed text-ink2">{hero.subtitle}</p>
      </motion.section>

      {/* 两个主按钮：写信为主 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-10 flex flex-col gap-3"
      >
        <Link href="/write" className="btn-primary w-full py-4 text-[16px]">
          ✎ 写一封信
        </Link>
        <Link href="/read" className="btn-ghost w-full py-4 text-[16px]">
          ✉ 读一封信
        </Link>
      </motion.div>

      {/* 极简说明 */}
      <section className="mt-12 space-y-5 text-center font-ui text-[13px] text-ink2">
        <p>这里不鼓励快速聊天，而鼓励认真写信。</p>
        <p>你写下的信，会被一个愿意认真读完的陌生人收到，并得到一封温柔的回信。</p>
        <div className="flex justify-center gap-5 pt-2">
          <Link href="/rules" className="underline-offset-4 hover:underline">
            社区约定
          </Link>
          <Link href="/auth" className="underline-offset-4 hover:underline">
            登录 / 注册
          </Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
