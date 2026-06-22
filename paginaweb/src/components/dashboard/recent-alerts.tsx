'use client';

import Link from 'next/link';
import { ArrowRight, Bell } from 'lucide-react';
import type { Alert } from '@/types';
import AlertCardComponent from '@/components/ui/alert-card';

interface RecentAlertsProps {
  alerts: Alert[];
}

export default function RecentAlerts({ alerts }: RecentAlertsProps) {
  return (
    <section className="mt-12 space-y-8">
      <div className="flex items-end justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-none flex items-center gap-3">
            ALERTAS <Bell size={24} className="text-red-500" />
          </h2>
        </div>
        <Link
          href="/dashboard/alerts"
          className="
            text-sm text-zinc-400 hover:text-white
            font-bold tracking-widest uppercase flex items-center gap-2
            transition-colors duration-300 cursor-pointer
          "
        >
          Ver Historial
          <ArrowRight size={16} />
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 rounded-3xl glass-dark border border-white/5 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Bell size={32} className="text-emerald-500" />
          </div>
          <p className="text-xl font-light text-white mb-2">Sin alertas activas</p>
          <p className="text-sm font-light text-zinc-500">Todas las silobolsas operan normalmente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCardComponent key={alert.id} alert={alert} compact />
          ))}
        </div>
      )}
    </section>
  );
}
