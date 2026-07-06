'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { BackHeader, Toast } from '@/components/ui';

type Mode = 'login' | 'register';

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  const sendCode = async () => {
    if (!email.includes('@')) return notify('请输入有效的邮箱');
    setSending(true);
    try {
      await api.post('/auth/code', { target: email, scene: mode });
      notify('验证码已发送（开发环境请看后端控制台）');
      setCountdown(60);
      const t = setInterval(() => setCountdown((c) => (c <= 1 ? (clearInterval(t), 0) : c - 1)), 1000);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '发送失败');
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (!email.includes('@') || code.length !== 6) return notify('请填写邮箱和 6 位验证码');
    if (mode === 'register' && !nickname.trim()) return notify('给自己起一个昵称吧');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await api.post('/auth/register', { accountType: 'EMAIL', target: email, code, nickname });
        // 注册后用同一邮箱再走登录拿 token
        await api.post('/auth/code', { target: email, scene: 'login' });
        notify('注册成功，请用新验证码登录');
        setMode('login');
        setCode('');
        return;
      }
      await api.post('/auth/login', { target: email, code });
      router.replace(next);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pb-16">
      <BackHeader title="登录 / 注册" />
      <div className="mt-6 text-center">
        <p className="font-hand text-[24px] text-ink">慢慢来，先进门坐一会儿</p>
        <p className="mt-2 font-ui text-[13px] text-ink2">匿名书信，只需要一个邮箱</p>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-[200px] rounded-full border border-line bg-letter p-1 font-ui text-[14px]">
        {(['login', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-1.5 transition-colors ${
              mode === m ? 'bg-stamp text-letter' : 'text-ink2'
            }`}
          >
            {m === 'login' ? '登录' : '注册'}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <input
          className="field"
          type="email"
          inputMode="email"
          placeholder="你的邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode === 'register' && (
          <input
            className="field"
            placeholder="一个匿名昵称"
            maxLength={32}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        )}
        <div className="flex gap-2">
          <input
            className="field flex-1"
            inputMode="numeric"
            maxLength={6}
            placeholder="6 位验证码"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <button className="btn-ghost whitespace-nowrap" disabled={sending || countdown > 0} onClick={sendCode}>
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </button>
        </div>
        <button className="btn-primary mt-2 w-full py-3.5" disabled={submitting} onClick={submit}>
          {mode === 'login' ? '进入邮局' : '注册'}
        </button>
      </div>

      <p className="mt-6 text-center font-ui text-[12px] text-ink2">
        登录即表示你愿意遵守
        <a href="/rules" className="text-stamp underline-offset-4 hover:underline">
          社区约定
        </a>
      </p>
      <Toast message={toast} />
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}
