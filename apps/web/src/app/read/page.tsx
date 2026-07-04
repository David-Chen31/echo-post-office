'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, ApiError, ClaimResult, LetterReader } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
import { CATEGORY_LABELS, MOOD_LABELS } from '@/lib/labels';
import { LetterPaper, LetterText } from '@/components/LetterPaper';
import { FontToggle } from '@/components/FontToggle';
import { useReadingFont } from '@/lib/useReadingFont';
import { BackHeader, EmptyState, Spinner, Toast } from '@/components/ui';

export default function ReadPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useRequireAuth();
  const { font, toggle } = useReadingFont();

  const [letter, setLetter] = useState<LetterReader | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  };

  const fetchOne = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<{ letter: LetterReader | null }>('/mailbox/inbox');
      setLetter(r.letter);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) void fetchOne();
  }, [profile, fetchOne]);

  const claim = async () => {
    if (!letter) return;
    setBusy(true);
    try {
      const r = await api.post<ClaimResult>(`/mailbox/inbox/${letter.letterId}/claim`);
      router.push(`/reply/${r.claimId}`);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '领取失败');
      setBusy(false);
      void fetchOne();
    }
  };

  const skip = async () => {
    if (!letter) return;
    setBusy(true);
    try {
      await api.post(`/mailbox/inbox/${letter.letterId}/skip`);
    } catch {
      /* ignore */
    }
    setBusy(false);
    void fetchOne();
  };

  const report = async () => {
    if (!letter) return;
    try {
      await api.post('/reports', { targetType: 'LETTER', targetId: letter.letterId, reason: 'OTHER' });
      notify('已收到你的举报，我们会认真处理');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '举报失败');
    }
  };

  if (authLoading || !profile) return <Spinner label="正在走向待回信箱…" />;

  return (
    <main className="pb-28">
      <BackHeader title="读一封信" right={<FontToggle font={font} onToggle={toggle} />} />

      {loading ? (
        <Spinner label="正在取出一封信…" />
      ) : !letter ? (
        <EmptyState title="待回信箱暂时空了" hint="好的来信值得等待，过会儿再来看看" />
      ) : (
        <motion.div
          key={letter.letterId}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mt-4 mb-3 flex items-center gap-2 font-ui text-[12px] text-ink2">
            <span className="rounded-full bg-paper2 px-2.5 py-1">{CATEGORY_LABELS[letter.category] ?? '其他'}</span>
            {letter.mood && <span className="rounded-full bg-paper2 px-2.5 py-1">{MOOD_LABELS[letter.mood]}</span>}
            <span className="ml-auto">{letter.fuzzyTime}</span>
          </div>

          {letter.title && <h2 className="mb-2 font-hand text-[22px] text-ink">{letter.title}</h2>}

          <LetterPaper font={font}>
            <LetterText text={letter.content} />
          </LetterPaper>

          <p className="mt-5 text-center font-ui text-[12px] text-ink2">
            如果你愿意认真回应这封信，就领取它。领取后请在 24 小时内完成回信。
          </p>

          <div className="mt-4 flex gap-3">
            <button className="btn-ghost flex-1" disabled={busy} onClick={skip}>
              换一封
            </button>
            <button className="btn-primary flex-1" disabled={busy} onClick={claim}>
              领取这封信
            </button>
          </div>
          <button onClick={report} className="mt-4 w-full text-center font-ui text-[12px] text-ink2 hover:text-stamp">
            举报不当内容
          </button>
        </motion.div>
      )}
      <Toast message={toast} />
    </main>
  );
}
