'use client';

import { Bell, Search, User, Package } from 'lucide-react';
import Link from 'next/link';
import StatusPill from '@/components/ui/status-pill';
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
          {/* Search */}
          <button
            className="
              p-2.5 rounded-lg
              text-zinc-400 hover:text-white
              hover:bg-white/5
              transition-colors duration-150 cursor-pointer
            "
            title="Buscar (Cmd+K)"
          >
            <Search size={20} />
          </button>

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

          {/* User */}
          <div className="
            ml-1 p-2 rounded-lg
            bg-white/5 border border-white/5
            flex items-center gap-2 cursor-pointer
            hover:bg-white/10 transition-colors duration-150
          ">
            <User size={18} className="text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)] hidden md:inline">
              Demo
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
