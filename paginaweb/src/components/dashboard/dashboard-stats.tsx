'use client';

import { motion } from 'framer-motion';
import { Warehouse, Radio, Bell, Zap } from 'lucide-react';
import type { DashboardStats as DashboardStatsType } from '@/types';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const items = [
    {
      icon: Warehouse,
      label: 'SILOBOLSAS',
      value: stats.totalSilos,
      detail: 'MONITOREADAS',
      color: 'text-emerald-400',
    },
    {
      icon: Radio,
      label: 'TELEMETRÍA',
      value: `${stats.activeSensors}/${stats.totalSensors}`,
      detail: 'SENSORES ONLINE',
      color: 'text-blue-400',
    },
    {
      icon: Bell,
      label: 'RIESGO',
      value: stats.activeAlerts,
      detail: stats.criticalAlerts > 0 ? `${stats.criticalAlerts} ALERTAS CRÍTICAS` : 'ESTADO NORMAL',
      color: stats.criticalAlerts > 0 ? 'text-red-500' : 'text-amber-400',
    },
    {
      icon: Zap,
      label: 'ENERGÍA',
      value: `${stats.averageBattery}%`,
      detail: 'AUTONOMÍA PROMEDIO',
      color: stats.averageBattery < 30 ? 'text-amber-400' : 'text-zinc-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-8">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
            className="
              flex flex-col justify-between p-6 rounded-3xl
              glass-dark border border-white/5
              transition-all duration-300 hover:bg-white/5 group
            "
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-semibold tracking-widest text-white/40 uppercase">{item.label}</span>
              <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                <Icon size={24} className={item.color} />
              </div>
            </div>
            
            <div>
              <p className={`font-data text-3xl lg:text-4xl font-bold tracking-tighter ${item.color}`}>
                {item.value}
              </p>
              <p className="text-[10px] mt-1 font-bold tracking-widest uppercase text-zinc-500">{item.detail}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
