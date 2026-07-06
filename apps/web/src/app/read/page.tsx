'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, ApiError, ClaimResult, LetterReader } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
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
      router.push(`/reply?claim=${r.claimId}`);
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
          initial={{ opacity: 0, y: 20, scaleY: 0.97 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="origin-top"
        >
          <div className="mt-4 mb-3 flex items-center justify-between font-ui text-[12px] text-ink2">
            <span>你从待回信箱里取出了一封信</span>
            <span>{letter.fuzzyTime}</span>
          </div>

          {letter.title && <h2 className="mb-2 font-hand text-[22px] text-ink">{letter.title}</h2>}

          <LetterPaper font={font}>
            {letter.salutation && (
              <p className="text-ink2" style={{ textIndent: 0 }}>
                {letter.salutation}
              </p>
            )}
            <LetterText text={letter.content} />
            {(letter.signature || letter.signedDate) && (
              <div className="mt-4 text-right text-ink2">
                {letter.signature && <p style={{ textIndent: 0 }}>—— {letter.signature}</p>}
                {letter.signedDate && (
                  <p className="text-[15px]" style={{ textIndent: 0 }}>
                    {letter.signedDate}
                  </p>
                )}
              </div>
            )}
          </LetterPaper>

          <p className="mt-5 text-center font-ui text-[12px] text-ink2">
            如果你愿意认真回应这封信，就把它留下吧。之后的 24 小时里，慢慢写完回信就好。
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
