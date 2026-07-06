'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useRequireAuth } from '@/lib/useAuth';
import { CATEGORY_OPTIONS, MOOD_OPTIONS } from '@/lib/labels';
import { BackHeader, Spinner, Toast } from '@/components/ui';
import { LetterCategory } from '@letter/shared';

const PROMPTS = [
  '最近最让你放不下的一件事是什么？',
  '有没有一句话，一直没能说出口？',
  '如果此刻有人愿意安静听你说，你想从哪写起？',
];

// 客户端轻量敏感信息预检（仅提示，最终以服务端为准）
const CONTACT_RE = /(1[3-9]\d{9})|(微信|vx|wechat|qq)\s*[:：]?\s*[a-zA-Z0-9_-]{5,}/i;
// 自伤/危机词：命中时给温和的紧急求助提示（非诊断、非阻断）
const CRISIS_WORDS = ['自杀', '轻生', '不想活', '想死', '结束生命', '自残', '活不下去'];
const hasCrisis = (t: string) => CRISIS_WORDS.some((w) => t.includes(w));

export default function WritePage() {
  const router = useRouter();
  const { profile, loading } = useRequireAuth();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(LetterCategory.JUST_TALK);
  const [mood, setMood] = useState<string>('');
  const [showMeta, setShowMeta] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [crisisText, setCrisisText] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const crisisAck = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api
      .get<{ value: string }>('/configs/emergency.notice')
      .then((r) => setCrisisText(r.value))
      .catch(() => setCrisisText('如果你正处在危险或极度痛苦中，请立即联系现实中可信任的人或当地紧急服务。本平台不能替代专业帮助。'));
  }, []);

  // Tab：段首空两格（插入两个全角空格）
  const handleTab = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const indent = '　　';
    const next = content.slice(0, start) + indent + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + indent.length;
    });
  };

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  };

  // 本地草稿恢复
  useEffect(() => {
    const d = localStorage.getItem('letter-draft');
    if (d) {
      try {
        const p = JSON.parse(d);
        setContent(p.content || '');
        setTitle(p.title || '');
        if (p.category) setCategory(p.category);
        if (p.mood) setMood(p.mood);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // 防抖自动保存（本地 + 服务端兜底）
  useEffect(() => {
    if (!content.trim()) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      localStorage.setItem('letter-draft', JSON.stringify({ content, title, category, mood }));
      try {
        await api.post('/letters/draft', {
          content,
          title: title || undefined,
          category: category || undefined,
          mood: mood || undefined,
        });
        setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      } catch {
        /* 本地已存，忽略 */
      }
    }, 1200);
    return () => clearTimeout(saveTimer.current);
  }, [content, title, category, mood]);

  const submit = async () => {
    if (content.trim().length < 50) return notify('再多写一点点吧，至少 50 字，让对方更懂你');
    if (CONTACT_RE.test(content)) {
      notify('为保护你和对方，请不要在信中留下联系方式');
      return;
    }
    // 命中危机词：先弹温和求助提示（不阻断，可继续寄出）
    if (hasCrisis(content) && !crisisAck.current) {
      setShowCrisis(true);
      return;
    }
    setSubmitting(true);
    try {
      await api.post(
        '/letters',
        { content, title: title || undefined, category, mood: mood || undefined },
        { 'Idempotency-Key': crypto.randomUUID() },
      );
      localStorage.removeItem('letter-draft');
      router.push('/write/sent');
    } catch (e) {
      notify(e instanceof ApiError ? e.message : '投递失败，请稍后再试');
      setSubmitting(false);
    }
  };

  if (loading || !profile) return <Spinner label="正在为你铺开信纸…" />;

  const count = content.trim().length;

  return (
    <main className="relative left-1/2 w-screen -translate-x-1/2 pb-28">
      <div className="mx-auto w-full max-w-[820px] px-5">
        <BackHeader title="写一封信" right={savedAt ? <span className="font-ui text-[11px] text-ink2">已存 {savedAt}</span> : null} />

        {/* 信纸编辑区：连续横线，标题与正文落在同一套线上 */}
        <div className="writing-sheet card mt-4 px-7 py-6 sm:px-9">
          <input
            className="writing-title ruled-bg"
            placeholder="给这封信起个标题（可不填）"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            ref={areaRef}
            className="writing-area ruled-bg min-h-[58vh]"
            placeholder={`　　此刻，你想说点什么……\n\n（不知道从哪写起？${prompt}）\n（提示：按 Tab 键可在段首空两格）`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleTab}
            autoFocus
          />
        </div>

        {/* 字数 + 折叠的主题/心情 */}
        <div className="mt-3 flex items-center justify-between font-ui text-[12px] text-ink2">
          <span>{count} 字{count > 0 && count < 50 ? ' · 再写一点点' : ''}</span>
          <button onClick={() => setShowMeta((v) => !v)} className="hover:text-ink">
            {showMeta ? '收起' : '主题 · 心情 ▾'}
          </button>
        </div>

        {showMeta && (
          <div className="mt-3 space-y-4 animate-fade-up">
          <div>
            <p className="mb-2 font-ui text-[12px] text-ink2">这封信关于</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((o) => (
                <Chip key={o.value} active={category === o.value} onClick={() => setCategory(o.value)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-ui text-[12px] text-ink2">此刻的心情（可不选）</p>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((o) => (
                <Chip key={o.value} active={mood === o.value} onClick={() => setMood(mood === o.value ? '' : o.value)}>
                  {o.label}
                </Chip>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* 封信按钮 */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto max-w-[820px]">
          <button className="btn-primary w-full py-3.5" disabled={submitting} onClick={submit}>
            {submitting ? '正在封好信件…' : '封好信件'}
          </button>
        </div>
      </div>
      <Toast message={toast} />

      {showCrisis && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-6">
          <div className="w-full max-w-[420px] rounded-card bg-letter p-6 shadow-paper">
            <p className="font-hand text-[22px] text-ink">你并不孤单</p>
            <p className="mt-3 font-print text-[14.5px] leading-relaxed text-ink">{crisisText}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                className="btn-primary w-full py-3"
                onClick={() => {
                  crisisAck.current = true;
                  setShowCrisis(false);
                  void submit();
                }}
              >
                我明白了，仍然寄出这封信
              </button>
              <button className="btn-ghost w-full py-3" onClick={() => setShowCrisis(false)}>
                先停一下
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 font-ui text-[13px] transition-colors ${
        active ? 'border-stamp bg-stamp text-paper' : 'border-line bg-letter text-ink2 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
