'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Profile } from './api';

/** 拉取当前用户；未登录返回 null。 */
export function useProfile(): { profile: Profile | null; loading: boolean } {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get<Profile>('/me')
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);
  return { profile, loading };
}

/** 要求登录：未登录则跳转 /auth?next=当前路径。 */
export function useRequireAuth(): { profile: Profile | null; loading: boolean } {
  const router = useRouter();
  const { profile, loading } = useProfile();
  useEffect(() => {
    if (!loading && !profile) {
      const next = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.replace(`/auth?next=${encodeURIComponent(next)}`);
    }
  }, [loading, profile, router]);
  return { profile, loading };
}
