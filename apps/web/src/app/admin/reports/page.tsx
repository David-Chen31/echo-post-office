'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { BackHeader, EmptyState, Spinner, Toast } from '@/components/ui';

interface ReportItem {
  reportId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  priority: string;
  status: string;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  HARASSMENT: '骚扰', ATTACK: '人身攻击', PORN: '色情', AD_FRAUD: '广告诈骗',
  ASK_CONTACT: '索要联系方式', DANGEROUS_ADVICE: '危险建议', PRIVACY_LEAK: '泄露隐私', OTHER: '其他',
};

export default function ReportsQueue() {
  const { profile, loading } = useRequireAdmin();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  const load = useCallback(async () => {
    try {
      setReports(await api.get<ReportItem[]>('/admin/reports'));
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '加载失败');
    }
  }, []);

  useEffect(() => {
    if (profile) void load();
  }, [profile, load]);

  const handle = async (id: string, status: string) => {
    setBusy(true);
    try {
      await api.post(`/admin/reports/${id}/handle`, { status });
      notify('已处理');
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
      <BackHeader title="举报处理" />
      <div className="mt-4 space-y-3">
        {reports.length === 0 ? (
          <EmptyState title="没有待处理的举报" />
        ) : (
          reports.map((r) => (
            <div key={r.reportId} className="card p-4">
              <div className="flex items-center justify-between font-ui text-[12px] text-ink2">
                <span>{r.targetType} #{r.targetId}</span>
                <span className={r.priority === 'HIGH' ? 'font-medium text-stamp' : ''}>优先级 {r.priority}</span>
              </div>
              <p className="mt-1 font-print text-[15px] text-ink">{REASON_LABELS[r.reason] ?? r.reason}</p>
              {r.description && <p className="mt-1 font-ui text-[13px] text-ink2">{r.description}</p>}
              <div className="mt-3 flex gap-2">
                <button disabled={busy} className="btn-primary flex-1 py-2" onClick={() => handle(r.reportId, 'RESOLVED')}>已处理</button>
                <button disabled={busy} className="btn-ghost flex-1 py-2" onClick={() => handle(r.reportId, 'REJECTED')}>驳回</button>
              </div>
            </div>
          ))
        )}
      </div>
      <Toast message={toast} />
    </main>
  );
}
