'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { CATEGORY_LABELS } from '@/lib/labels';
import { BackHeader, EmptyState, Spinner, Toast } from '@/components/ui';

interface LetterItem {
  letterId: string;
  title: string | null;
  content: string;
  category: string;
  riskLevel: string;
  hits: { type: string; matched: string }[];
}
interface ReplyItem {
  replyId: string;
  letterId: string;
  content: string;
  riskLevel: string;
}

export default function ModerationQueue() {
  const { profile, loading } = useRequireAdmin();
  const [tab, setTab] = useState<'letters' | 'replies'>('letters');
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  const load = useCallback(async () => {
    try {
      if (tab === 'letters') setLetters(await api.get<LetterItem[]>('/admin/letters'));
      else setReplies(await api.get<ReplyItem[]>('/admin/replies'));
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '加载失败');
    }
  }, [tab]);

  useEffect(() => {
    if (profile) void load();
  }, [profile, load]);

  const review = async (kind: 'letters' | 'replies', id: string, action: string) => {
    setBusy(true);
    try {
      await api.post(`/admin/${kind}/${id}/review`, { action });
      notify(action === 'REJECT' ? '已拒绝' : '已放行');
      await load();
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '操作失败');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !profile) return <Spinner />;

  return (
    <main className="pb-16">
      <BackHeader title="内容审核" />
      <div className="mt-3 flex gap-2">
        {(['letters', 'replies'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 font-ui text-[13px] ${
              tab === t ? 'bg-stamp text-letter' : 'border border-line bg-letter text-ink2'
            }`}
          >
            {t === 'letters' ? '待审信件' : '待审回信'}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {tab === 'letters' ? (
          letters.length === 0 ? (
            <EmptyState title="没有待审信件" />
          ) : (
            letters.map((l) => (
              <div key={l.letterId} className="card p-4">
                <div className="flex items-center justify-between font-ui text-[12px] text-ink2">
                  <span>{CATEGORY_LABELS[l.category] ?? l.category}</span>
                  <span className={l.riskLevel === 'HIGH' ? 'font-medium text-stamp' : ''}>
                    风险 {l.riskLevel}
                  </span>
                </div>
                {l.title && <p className="mt-1 font-hand text-[18px] text-ink">{l.title}</p>}
                <p className="mt-1 whitespace-pre-wrap font-print text-[14px] leading-relaxed text-ink">{l.content}</p>
                {l.hits.length > 0 && (
                  <p className="mt-2 font-ui text-[12px] text-stamp">
                    命中：{l.hits.map((h) => `${h.type}(${h.matched})`).join('、')}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button disabled={busy} className="btn-primary flex-1 py-2" onClick={() => review('letters', l.letterId, 'PASS')}>放行</button>
                  <button disabled={busy} className="btn-ghost flex-1 py-2" onClick={() => review('letters', l.letterId, 'RETURN')}>退回修改</button>
                  <button disabled={busy} className="btn-ghost flex-1 py-2" onClick={() => review('letters', l.letterId, 'REJECT')}>拒绝</button>
                </div>
              </div>
            ))
          )
        ) : replies.length === 0 ? (
          <EmptyState title="没有待审回信" />
        ) : (
          replies.map((r) => (
            <div key={r.replyId} className="card p-4">
              <div className="font-ui text-[12px] text-ink2">回信 · 风险 {r.riskLevel}</div>
              <p className="mt-1 whitespace-pre-wrap font-print text-[14px] leading-relaxed text-ink">{r.content}</p>
              <div className="mt-3 flex gap-2">
                <button disabled={busy} className="btn-primary flex-1 py-2" onClick={() => review('replies', r.replyId, 'PASS')}>放行</button>
                <button disabled={busy} className="btn-ghost flex-1 py-2" onClick={() => review('replies', r.replyId, 'REJECT')}>拒绝</button>
              </div>
            </div>
          ))
        )}
      </div>
      <Toast message={toast} />
    </main>
  );
}
