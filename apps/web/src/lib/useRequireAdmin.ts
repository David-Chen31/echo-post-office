'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Profile } from './api';

/** 要求管理员/审核员角色；否则跳回首页。 */
export function useRequireAdmin(): { profile: Profile | null; loading: boolean } {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get<Profile>('/me')
      .then((p) => {
        if (p.role === 'admin' || p.role === 'moderator') setProfile(p);
        else router.replace('/');
      })
      .catch(() => router.replace('/auth?next=/admin'))
      .finally(() => setLoading(false));
  }, [router]);
  return { profile, loading };
}
