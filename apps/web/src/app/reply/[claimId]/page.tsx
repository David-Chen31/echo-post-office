'use client';

import { KeyboardEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, ApiError, ReplyingItem } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
import { LetterPaper, LetterText } from '@/components/LetterPaper';
import { FontToggle } from '@/components/FontToggle';
import { useReadingFont } from '@/lib/useReadingFont';
import { BackHeader, Spinner, Toast } from '@/components/ui';

export default function ReplyPage() {
  const router = useRouter();
  const { claimId } = useParams<{ claimId: string }>();
  const { profile, loading: authLoading } = useRequireAuth();
  const { font, toggle } = useReadingFont();

  const [item, setItem] = useState<ReplyingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [done, setDone] = useState<null | 'published' | 'pending'>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    if (!profile) return;
    api
      .get<ReplyingItem[]>('/mailbox/replying')
      .then((list) => setItem(list.find((i) => i.claimId === claimId) ?? null))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [profile, claimId]);

  // 回信草稿本地保存
  useEffect(() => {
    const k = `reply-draft-${claimId}`;
    const saved = localStorage.getItem(k);
    if (saved) setContent(saved);
  }, [claimId]);
  useEffect(() => {
    if (content) localStorage.setItem(`reply-draft-${claimId}`, content);
  }, [content, claimId]);

  const submit = async () => {
    if (content.trim().length < 30) return notify('再多写一点点，哪怕只是说“我读完了，我在”');
    setSubmitting(true);
    try {
      const r = await api.post<{ status: string; pendingModeration: boolean }>(
        '/replies',
        { claimId, content },
        { 'Idempotency-Key': crypto.randomUUID() },
      );
      localStorage.removeItem(`reply-draft-${claimId}`);
      setDone(r.pendingModeration ? 'pending' : 'published');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '回信失败');
      setSubmitting(false);
    }
  };

  if (authLoading || !profile || loading) return <Spinner label="正在打开这封信…" />;

  if (done) {
    return (
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="font-hand text-[24px] leading-relaxed text-ink">
            {done === 'published'
              ? '你的回信已经寄出。\n谢谢你，愿意认真读完一个陌生人的心事。'
              : '你的回信正在被认真核对，\n通过后会送到对方的信箱。'}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button onClick={() => router.push('/read')} className="btn-primary w-full py-3.5">
              再读一封信
            </button>
            <button onClick={() => router.push('/mailbox')} className="btn-ghost w-full py-3.5">
              回到信箱
            </button>
          </div>
        </motion.div>
        <Toast message={toast} />
      </main>
    );
  }

  if (!item) {
    return (
      <main>
        <BackHeader title="回信" />
        <p className="mt-16 text-center font-hand text-[20px] text-ink">这封信不在你的回信列表里</p>
        <p className="mt-2 text-center font-ui text-[13px] text-ink2">也许领取已超时，信件已回到待领取池</p>
        <button onClick={() => router.push('/read')} className="btn-ghost mx-auto mt-6 block">
          去读别的信
        </button>
      </main>
    );
  }

  return (
    <main className="pb-28">
      <BackHeader title="回信" right={<FontToggle font={font} onToggle={toggle} />} />

      {/* 原信（可折叠） */}
      <button
        onClick={() => setShowOriginal((v) => !v)}
        className="mt-4 mb-2 flex w-full items-center justify-between font-ui text-[13px] text-ink2"
      >
        <span>{item.letterTitle || '对方的来信'}</span>
        <span>{showOriginal ? '收起原信 ▴' : '展开原信 ▾'}</span>
      </button>
      {showOriginal && (
        <LetterPaper font={font} className="mb-5">
          <LetterText text={item.content} />
        </LetterPaper>
      )}

      {/* 温和引导 */}
      <div className="mb-3 rounded-card border border-line/70 bg-paper2/60 p-4 font-ui text-[12.5px] leading-relaxed text-ink2">
        先回应对方的感受，再表达自己的看法。
        <br />
        不必解决所有问题，认真读完本身就是一种回应。
      </div>

      {/* 回信编辑 */}
      <div className="writing-sheet card px-7 py-6">
        <textarea
          className="writing-area ruled-bg min-h-[38vh]"
          placeholder="　　给这位陌生人写下你的回应……（按 Tab 段首空两格）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key !== 'Tab') return;
            e.preventDefault();
            const el = e.currentTarget;
            const s = el.selectionStart;
            const next = content.slice(0, s) + '　　' + content.slice(el.selectionEnd);
            setContent(next);
            requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = s + 2;
            });
          }}
          autoFocus
        />
      </div>
      <div className="mt-2 text-right font-ui text-[12px] text-ink2">{content.trim().length} 字</div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto max-w-[560px]">
          <button className="btn-primary w-full py-3.5" disabled={submitting} onClick={submit}>
            {submitting ? '正在寄出回信…' : '寄出回信'}
          </button>
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
