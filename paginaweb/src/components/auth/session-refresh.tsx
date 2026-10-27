'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { clearServerSession, establishServerSession } from '@/lib/auth-client';

export default function SessionRefresh({ enabled = true }: { enabled?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !auth) return;

    let cancelled = false;

    async function sync(user: User | null) {
      if (!user) {
        await clearServerSession();
        if (!cancelled) router.replace('/login');
        return;
      }
      try {
        await establishServerSession(user);
      } catch {
        if (!cancelled) router.replace('/login');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void sync(user);
    });

    const refresh = async () => {
      const user = auth?.currentUser;
      if (!user) return;
      try {
        await establishServerSession(user);
        if (!cancelled) router.refresh();
      } catch {
        if (!cancelled) router.replace('/login');
      }
    };

    const interval = window.setInterval(refresh, 20 * 60 * 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, router]);

  return null;
}
