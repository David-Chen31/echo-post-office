'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ReceivedReply, ReplyingItem, SentLetter } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
import { CATEGORY_LABELS, LETTER_STATUS_LABELS } from '@/lib/labels';
import { BackHeader, EmptyState, Spinner } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

type Tab = 'received' | 'sent' | 'replying' | 'favorites' | 'drafts';
const TABS: { key: Tab; label: string }[] = [
  { key: 'received', label: '收到' },
  { key: 'sent', label: '寄出' },
  { key: 'replying', label: '回复中' },
  { key: 'favorites', label: '收藏' },
  { key: 'drafts', label: '草稿' },
];

export default function MailboxPage() {
  const { profile, loading: authLoading } = useRequireAuth();
  const [tab, setTab] = useState<Tab>('received');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown[]>([]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    const path =
      tab === 'received'
        ? '/mailbox/received'
        : tab === 'sent'
          ? '/mailbox/sent'
          : tab === 'replying'
            ? '/mailbox/replying'
            : tab === 'favorites'
              ? '/mailbox/favorites'
              : '/mailbox/drafts';
    api
      .get<unknown[]>(path)
      .then((d) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [tab, profile]);

  if (authLoading || !profile) return <Spinner />;

  return (
    <main className="pb-24">
      <BackHeader title="我的信箱" />

      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 font-ui text-[13px] transition-colors ${
              tab === t.key ? 'bg-stamp text-paper' : 'bg-letter text-ink2 border border-line'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner />
        ) : data.length === 0 ? (
          <EmptyState
            title={tab === 'received' ? '还没有新的来信' : '这里还是空的'}
            hint={tab === 'received' ? '好的回信，值得等待' : undefined}
          />
        ) : (
          renderList(tab, data)
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function renderList(tab: Tab, data: unknown[]) {
  if (tab === 'received' || tab === 'favorites') {
    return (data as ReceivedReply[]).map((r) => (
      <Link key={r.replyId} href={`/mailbox/received/${r.replyId}`} className="card block p-4 hover:shadow-paper">
        <div className="flex items-center justify-between font-ui text-[12px] text-ink2">
          <span>{r.letterTitle || '一封回信'}</span>
          <span>{r.fuzzyTime}</span>
        </div>
        <p className="mt-2 line-clamp-2 font-hand text-[17px] leading-relaxed text-ink">{r.content}</p>
        <p className="mt-2 font-ui text-[12px] text-stamp">轻触，拆开这封回信 →</p>
      </Link>
    ));
  }
  if (tab === 'replying') {
    return (data as ReplyingItem[]).map((c) => (
      <Link key={c.claimId} href={`/reply/${c.claimId}`} className="card block p-4 hover:shadow-paper">
        <div className="flex items-center justify-between font-ui text-[12px] text-ink2">
          <span>{c.letterTitle || '待回信件'}</span>
          <span>剩余时间至 {new Date(c.expiresAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="mt-2 line-clamp-2 font-print text-[14px] text-ink2">{c.content}</p>
        <p className="mt-2 font-ui text-[12px] text-stamp">继续写回信 →</p>
      </Link>
    ));
  }
  if (tab === 'sent') {
    return (data as SentLetter[]).map((l) => (
      <div key={l.letterId} className="card p-4">
        <div className="flex items-center justify-between">
          <span className="font-hand text-[18px] text-ink">{l.title || '无标题的信'}</span>
          <span className="rounded-full bg-paper2 px-2.5 py-1 font-ui text-[12px] text-ink2">
            {LETTER_STATUS_LABELS[l.status] ?? l.status}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 font-ui text-[12px] text-ink2">
          <span>{CATEGORY_LABELS[l.category]}</span>
          <span>收到 {l.replyCount} 封回信</span>
        </div>
      </div>
    ));
  }
  // drafts
  return (data as { draftId: string; title: string | null; content: string; updatedAt: string }[]).map((d) => (
    <Link key={d.draftId} href="/write" className="card block p-4 hover:shadow-paper">
      <span className="font-hand text-[18px] text-ink">{d.title || '未命名草稿'}</span>
      <p className="mt-1 line-clamp-2 font-print text-[14px] text-ink2">{d.content}</p>
      <p className="mt-2 font-ui text-[12px] text-stamp">继续写 →</p>
    </Link>
  ));
}
