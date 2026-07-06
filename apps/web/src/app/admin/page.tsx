'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { BackHeader, Spinner } from '@/components/ui';

const TILES: { key: string; label: string }[] = [
  { key: 'pendingModeration', label: '待审核信件' },
  { key: 'pendingReports', label: '待处理举报' },
  { key: 'highRisk', label: '高风险内容' },
  { key: 'waitingLetters', label: '等待领取' },
  { key: 'repliedLetters', label: '已收到回信' },
  { key: 'newLetters', label: '24h 新信' },
  { key: 'activeUsers', label: '24h 活跃' },
  { key: 'totalUsers', label: '总用户' },
];

export default function AdminDashboard() {
  const { profile, loading } = useRequireAdmin();
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (profile) api.get<Record<string, number>>('/admin/dashboard').then(setStats).catch(() => {});
  }, [profile]);

  if (loading || !profile) return <Spinner label="正在核对身份…" />;

  return (
    <main className="pb-16">
      <BackHeader title="管理后台" />
      <p className="mt-4 font-ui text-[13px] text-ink2">你好，{profile.nickname}（{profile.role}）</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {TILES.map((t) => (
          <div key={t.key} className="card p-4">
            <p className="font-ui text-[12px] text-ink2">{t.label}</p>
            <p className="mt-1 font-hand text-[28px] text-ink">{stats[t.key] ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/admin/moderation" className="btn-primary w-full py-3.5">内容审核队列</Link>
        <Link href="/admin/reports" className="btn-ghost w-full py-3.5">举报处理</Link>
      </div>
    </main>
  );
}
