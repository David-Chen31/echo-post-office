'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DeskWriter } from '@/components/DeskWriter';
import { BottomNav } from '@/components/BottomNav';
import { Spinner } from '@/components/ui';
import { useProfile } from '@/lib/useAuth';
import { api } from '@/lib/api';

interface Hero {
  title: string;
  subtitle: string;
}

const DEFAULT_HERO: Hero = {
  title: '有些话，不知道该说给谁听。',
  subtitle: '把它写成一封信，寄给一个愿意认真读完的人。',
};

function useHero() {
  const [hero, setHero] = useState<Hero>(DEFAULT_HERO);
  useEffect(() => {
    api
      .get<{ key: string; value: Hero }>('/configs/home.hero')
      .then((r) => r.value && setHero(r.value))
      .catch(() => {
        /* 用默认文案兜底 */
      });
  }, []);
  return hero;
}

export default function HomePage() {
  const { profile, loading } = useProfile();

  if (loading) return <Spinner label="正在铺开桌面…" />;
  return profile ? <Desk /> : <Foyer />;
}

/* 未登录：门厅。只讲这里是什么 + 一个进门的入口，不暴露任何功能。 */
function Foyer() {
  const hero = useHero();
  const [stories, setStories] = useState<string[]>([]);
  useEffect(() => {
    api
      .get<{ value: string[] }>('/configs/home.stories')
      .then((r) => Array.isArray(r.value) && setStories(r.value))
      .catch(() => {
        /* 无故事则不展示 */
      });
  }, []);
  return (
    <main className="flex min-h-[100dvh] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="w-full"
        >
          <DeskWriter className="mx-auto max-w-[280px]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-2"
        >
          <h1 className="font-hand text-[30px] leading-[1.5] text-ink">{hero.title}</h1>
          <p className="mt-3 font-print text-[15px] leading-relaxed text-ink2">{hero.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-12 w-full max-w-[300px]"
        >
          <Link href="/auth" className="btn-primary w-full py-4 text-[16px]">
            坐下来，写一封信吧
          </Link>
          <p className="mt-5 font-ui text-[13px] text-ink2">
            已有账号？
            <Link href="/auth" className="ml-1 text-stamp underline-offset-4 hover:underline">
              登录
            </Link>
          </p>
        </motion.div>
      </div>

      {stories.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mx-auto w-full max-w-[420px] space-y-2 pb-8"
        >
          {stories.slice(0, 3).map((s, i) => (
            <p key={i} className="font-hand text-[15px] leading-relaxed text-ink2/90">
              {s}
            </p>
          ))}
        </motion.section>
      )}

      <footer className="pb-10 text-center font-ui text-[12px] text-ink2">
        <p>这里没有匆忙的聊天，只有慢慢写下的信。</p>
        <Link href="/rules" className="mt-2 inline-block underline-offset-4 hover:underline">
          社区约定
        </Link>
      </footer>
    </main>
  );
}

/* 已登录：书桌。写信 / 读信入口 + 底部导航。 */
function Desk() {
  const hero = useHero();
  return (
    <main className="pb-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="pt-8"
      >
        <DeskWriter className="mx-auto max-w-[300px]" />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-4 text-center"
      >
        <h1 className="font-hand text-[30px] leading-[1.5] text-ink">{hero.title}</h1>
        <p className="mt-3 font-print text-[16px] leading-relaxed text-ink2">{hero.subtitle}</p>
      </motion.section>

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

      <BottomNav />
    </main>
  );
}
