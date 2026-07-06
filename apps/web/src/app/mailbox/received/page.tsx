'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiError, ReceivedReply } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
import { Envelope } from '@/components/Envelope';
import { LetterPaper, LetterText } from '@/components/LetterPaper';
import { FontToggle } from '@/components/FontToggle';
import { useReadingFont } from '@/lib/useReadingFont';
import { useUnread } from '@/lib/useUnread';
import { BackHeader, Spinner, Toast } from '@/components/ui';

const FEEDBACKS: { type: string; label: string }[] = [
  { type: 'UNDERSTOOD', label: '让我感到被理解' },
  { type: 'SERIOUS', label: '很认真' },
  { type: 'HELPFUL', label: '对我有帮助' },
  { type: 'AVERAGE', label: '一般' },
  { type: 'UNCOMFORTABLE', label: '让我不太舒服' },
];

function ReceivedInner() {
  const id = useSearchParams().get('id') ?? '';
  const { profile, loading: authLoading } = useRequireAuth();
  const { font, toggle } = useReadingFont();
  const { markAllRead } = useUnread();

  const [reply, setReply] = useState<ReceivedReply | null>(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);

  // 拆信后自动标记通知已读
  useEffect(() => {
    if (opened) void markAllRead();
  }, [opened, markAllRead]);
  const [favorited, setFavorited] = useState(false);
  const [gave, setGave] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (!profile) return;
    api
      .get<ReceivedReply[]>('/mailbox/received')
      .then((list) => {
        const r = list.find((x) => x.replyId === id) ?? null;
        setReply(r);
        if (r) setFavorited(r.isFavorited);
      })
      .finally(() => setLoading(false));
  }, [profile, id]);

  const favorite = async () => {
    if (!reply) return;
    try {
      await api.post(`/replies/${reply.replyId}/favorite`);
      setFavorited(true);
      notify('已收藏这封回信');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '操作失败');
    }
  };

  const feedback = async (type: string) => {
    if (!reply) return;
    try {
      await api.post(`/replies/${reply.replyId}/feedback`, { type });
      setGave(type);
      notify('谢谢你的反馈，它只对我们可见');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '操作失败');
    }
  };

  if (authLoading || !profile || loading) return <Spinner label="正在走向你的信箱…" />;
  if (!reply) {
    return (
      <main>
        <BackHeader title="回信" />
        <p className="mt-16 text-center font-hand text-[20px] text-ink">没有找到这封回信</p>
      </main>
    );
  }

  return (
    <main className="pb-20">
      <BackHeader title="一封新来信" right={opened ? <FontToggle font={font} onToggle={toggle} /> : null} />

      {!opened && (
        <p className="mb-4 mt-6 text-center font-hand text-[20px] text-ink">你的信箱里有一封新来信。</p>
      )}

      <div className="mt-2">
        <Envelope opened={opened} onOpen={() => setOpened(true)}>
          <LetterPaper font={font}>
            <p className="text-ink2" style={{ textIndent: 0 }}>亲爱的你：</p>
            <LetterText text={reply.content} />
            <p className="mt-4 text-right font-hand text-[16px] text-ink2">—— 一个认真读过你信的人</p>
          </LetterPaper>

          {/* 读完轻轻放下：用安静的文字而非评分药丸 */}
          <div className="mt-8 border-t border-line/60 pt-5">
            <p className="mb-3 text-center font-ui text-[12px] text-ink2">读完之后，你想轻轻说一句——</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {FEEDBACKS.map((f) => (
                <button
                  key={f.type}
                  onClick={() => feedback(f.type)}
                  disabled={!!gave}
                  className={`font-ui text-[13px] underline-offset-4 transition-colors disabled:opacity-45 ${
                    gave === f.type ? 'text-stamp underline' : 'text-ink2 hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={favorite}
                disabled={favorited}
                className="font-ui text-[13px] text-ink2 underline-offset-4 hover:text-stamp disabled:opacity-45"
              >
                {favorited ? '已夹进收藏 ♥' : '把这封回信夹起来收藏'}
              </button>
            </div>
          </div>
        </Envelope>
      </div>
      <Toast message={toast} />
    </main>
  );
}

export default function ReceivedPage() {
  return (
    <Suspense fallback={<Spinner label="正在走向你的信箱…" />}>
      <ReceivedInner />
    </Suspense>
  );
}
