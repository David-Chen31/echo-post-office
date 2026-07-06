'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
import { BackHeader, Spinner, Toast } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, loading } = useRequireAuth();
  const [nickname, setNickname] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (profile) setNickname(profile.nickname);
  }, [profile]);

  if (loading || !profile) return <Spinner />;

  const save = async () => {
    try {
      await api.patch('/me', { nickname });
      notify('已保存');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '保存失败');
    }
  };

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

      <div className="mt-6 space-y-8">
        {/* 个人信笺：昵称即落款 */}
        <div>
          <p className="mb-1 font-ui text-[12px] text-ink2">写信时，你署名为</p>
          <input
            className="ink-field font-hand text-[20px]"
            maxLength={32}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <div className="mt-4">
            <button onClick={save} className="btn-primary px-6 py-2.5">
              保存
            </button>
          </div>
        </div>

        {/* 信誉：更温柔的呈现 */}
        <div className="font-ui text-[13px] leading-relaxed text-ink2">
          <p>
            你是这里的 <span className="font-hand text-[17px] text-ink">{profile.level}</span>，
            信任分 {profile.trustScore}。
          </p>
          <p className="mt-1">每天可以寄出 {profile.dailyWriteQuota} 封信、取回 {profile.dailyClaimQuota} 封来信。</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-line/60 pt-6">
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
