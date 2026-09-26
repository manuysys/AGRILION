'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User, Package, LogOut } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import StatusPill from '@/components/ui/status-pill';
import { auth } from '@/lib/firebase';
import { signOutUser } from '@/lib/auth-client';
import type { HealthState } from '@/types';

interface DashboardHeaderProps {
  systemHealth: HealthState;
  lastUpdate: string;
  activeAlerts: number;
}

export default function DashboardHeader({
  systemHealth,
  lastUpdate,
  activeAlerts,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    try {
      await signOutUser();
    } finally {
      setMenuOpen(false);
      router.push('/login');
    }
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Invitado';

  return (
    <header className="
      sticky top-0 z-40 h-16
      glass-dark border-b border-white/5
    ">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1400px] mx-auto">
        {/* Left: mobile logo + system status */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="lg:hidden flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-[var(--brand-primary)] flex items-center justify-center">
              <Package size={15} className="text-white" />
            </div>
            <span className="font-bold text-sm">Agrilion+</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <StatusPill state={systemHealth} size="sm" />
            <span className="text-xs text-[var(--text-muted)] font-data hidden md:inline">
              Actualizado {lastUpdate}
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Alerts */}
          <Link
            href="/dashboard/alerts"
            className="
              relative p-2.5 rounded-lg
              text-zinc-400 hover:text-white
              hover:bg-white/5
              transition-colors duration-150 cursor-pointer
            "
          >
            <Bell size={20} />
            {activeAlerts > 0 && (
              <span className="
                absolute top-1.5 right-1.5
                flex items-center justify-center
                min-w-[16px] h-4 px-1
                text-[9px] font-bold rounded-full
                bg-red-500 text-white
              ">
                {activeAlerts}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="
                ml-1 p-2 rounded-lg
                bg-white/5 border border-white/5
                flex items-center gap-2 cursor-pointer
                hover:bg-white/10 transition-colors duration-150
              "
            >
              <User size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-primary)] hidden md:inline max-w-[140px] truncate">
                {displayName}
              </span>
            </button>

            {menuOpen && (
              <div className="
                absolute right-0 mt-2 w-56 rounded-xl overflow-hidden
                bg-zinc-900 border border-white/10 shadow-2xl z-50
              ">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.displayName || 'Sesión'}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user?.email || 'Sin sesión iniciada'}
                  </p>
                </div>
                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-300 hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-emerald-300 hover:bg-white/5 transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
