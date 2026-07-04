'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
import { CATEGORY_OPTIONS } from '@/lib/labels';
import { BackHeader, Spinner, Toast } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, loading } = useRequireAuth();
  const [nickname, setNickname] = useState('');
  const [interested, setInterested] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setInterested(profile.interestedTopics ?? []);
    }
  }, [profile]);

  if (loading || !profile) return <Spinner />;

  const save = async () => {
    try {
      await api.patch('/me', { nickname, interestedTopics: interested });
      notify('已保存');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '保存失败');
    }
  };

  const toggleTopic = (v: string) =>
    setInterested((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    router.replace('/');
  };

  const remove = async () => {
    if (!confirm('确定注销账户吗？这会匿名化你的资料，且不可恢复。')) return;
    try {
      await api.del('/me');
      router.replace('/');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '操作失败');
    }
  };

  return (
    <main className="pb-24">
      <BackHeader title="我的" />

      <div className="mt-4 space-y-6">
        <div>
          <p className="mb-2 font-ui text-[12px] text-ink2">昵称</p>
          <input className="field" maxLength={32} value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>

        <div>
          <p className="mb-2 font-ui text-[12px] text-ink2">我感兴趣的主题</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => toggleTopic(o.value)}
                className={`rounded-full border px-3 py-1.5 font-ui text-[13px] transition-colors ${
                  interested.includes(o.value)
                    ? 'border-stamp bg-stamp text-paper'
                    : 'border-line bg-letter text-ink2'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} className="btn-primary w-full py-3.5">
          保存
        </button>

        <div className="rounded-card border border-line/70 bg-paper2/50 p-4 font-ui text-[12px] text-ink2">
          <p>等级：{profile.level}　信任分：{profile.trustScore}</p>
          <p className="mt-1">
            每日可投递 {profile.dailyWriteQuota} 封 · 可领取 {profile.dailyClaimQuota} 封
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button onClick={logout} className="btn-ghost w-full">
            退出登录
          </button>
          <button onClick={remove} className="w-full text-center font-ui text-[13px] text-ink2 hover:text-stamp">
            注销账户与删除数据
          </button>
        </div>
      </div>
      <Toast message={toast} />
      <BottomNav />
    </main>
  );
}
