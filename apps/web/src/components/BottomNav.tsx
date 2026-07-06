'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUnread } from '@/lib/useUnread';
import { useProfile } from '@/lib/useAuth';

const ITEMS = [
  { href: '/', label: '首页', icon: '⌂' },
  { href: '/write', label: '写信', icon: '✎' },
  { href: '/read', label: '读信', icon: '✉' },
  { href: '/mailbox', label: '信箱', icon: '🗀' },
  { href: '/settings', label: '我的', icon: '◔' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { count } = useUnread(!!profile);
  // 未登录不渲染导航（门厅不暴露任何功能入口）
  if (!profile) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[560px] items-stretch justify-around">
        {ITEMS.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 font-ui text-[11px] transition active:scale-95 ${
                active ? 'text-stamp' : 'text-ink2'
              }`}
            >
              <span className="relative text-[18px] leading-none">
                {it.icon}
                {it.href === '/mailbox' && count > 0 && (
                  <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-stamp" aria-label="有新来信" />
                )}
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
