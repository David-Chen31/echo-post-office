'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Stamp } from './Stamp';

/**
 * 信封 + 拆信动效（§5.3）：
 * 关闭态 -> 点击 -> 封盖掀起 -> 信纸展开 -> 正文淡入。
 * 长正文用平滑滚动阅读，不做真实翻页。
 */
export function Envelope({
  opened,
  onOpen,
  hint = '轻触，拆开这封信',
  children,
}: {
  opened: boolean;
  onOpen: () => void;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.button
            key="closed"
            type="button"
            onClick={onOpen}
            className="group relative mx-auto flex aspect-[3/2] w-full max-w-[360px] items-center justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            aria-label={hint}
          >
            <svg viewBox="0 0 360 240" className="w-full drop-shadow-[0_6px_16px_rgba(58,48,38,0.12)]">
              <rect x="6" y="40" width="348" height="194" rx="10" fill="#FBF8F1" stroke="#D9CFBC" strokeWidth="2" />
              {/* 封盖 */}
              <path d="M6 50 L180 150 L354 50" fill="none" stroke="#D9CFBC" strokeWidth="2" />
              <path d="M6 40 L180 150 L354 40 Z" fill="#F2ECDE" stroke="#D9CFBC" strokeWidth="2" />
            </svg>
            <div className="absolute -right-1 top-3">
              <Stamp size={56} />
            </div>
            <span className="absolute bottom-5 font-ui text-[13px] text-ink2 transition-colors group-hover:text-stamp">
              {hint}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="opened"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* 封盖掀起 */}
            <motion.div
              className="mx-auto h-3 w-full max-w-[360px] origin-top"
              initial={{ rotateX: 0 }}
              animate={{ rotateX: 180 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ transformPerspective: 600 }}
            />
            {/* 信纸抽出展开 + 正文淡入 */}
            <motion.div
              initial={{ y: 24, opacity: 0, scaleY: 0.96 }}
              animate={{ y: 0, opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
              className="origin-top"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
