'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Spinner({ label = '正在等待…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-ink2">
      <div className="h-7 w-7 animate-glow rounded-full border-2 border-line border-t-stamp" />
      <span className="font-ui text-[13px]">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-hand text-[22px] text-ink">{title}</p>
      {hint && <p className="font-ui text-[13px] text-ink2">{hint}</p>}
    </div>
  );
}

export function BackHeader({ title, right }: { title?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-paper/90 px-3 py-2 backdrop-blur">
      <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.88 }}>
        <Link
          href="/"
          aria-label="返回"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[22px] leading-none text-ink2 transition-colors hover:bg-letter hover:text-stamp"
        >
          ←
        </Link>
      </motion.div>
      {title && <span className="font-ui text-[15px] text-ink">{title}</span>}
      <div className="min-w-[40px] text-right">{right}</div>
    </header>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-6">
      <div className="animate-fade-up rounded-full bg-[#2a2620]/92 px-4 py-2 font-ui text-[13px] text-[#f7f3ea] shadow-soft">
        {message}
      </div>
    </div>
  );
}
