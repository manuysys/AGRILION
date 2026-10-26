'use client';

import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Warehouse, Radio, Bell, Zap } from 'lucide-react';
import type { DashboardStats as DashboardStatsType } from '@/types';

function AnimatedCounter({ from, to, duration = 2, suffix = '' }: { from: number, to: number, duration?: number, suffix?: string }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        setCount(Math.floor(value));
      }
    });
    return () => controls.stop();
  }, [from, to, duration]);

  return <span>{count}{suffix}</span>;
}

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const items = [
    {
      icon: Warehouse,
      label: 'SILOBOLSAS',
      valueContent: <AnimatedCounter from={0} to={stats.totalSilos} />,
      detail: 'TOTAL REGISTRADAS',
      color: 'text-emerald-400',
    },
    {
      icon: Radio,
      label: 'TELEMETRÍA',
      valueContent: <><AnimatedCounter from={0} to={stats.activeSensors} /> <span className="text-xl text-zinc-500">/ {stats.totalSensors}</span></>,
      detail: 'SENSORES ONLINE',
      color: 'text-blue-400',
    },
    {
      icon: Bell,
      label: 'ALERTAS ACTIVAS',
      valueContent: <AnimatedCounter from={0} to={stats.activeAlerts} />,
      detail: stats.criticalAlerts > 0
        ? `${stats.criticalAlerts} ALERTAS CRÍTICAS`
        : stats.activeAlerts > 0
          ? `${stats.activeAlerts} ALERTAS ACTIVAS`
          : 'SIN ALERTAS',
      color: stats.criticalAlerts > 0 ? 'text-red-500' : 'text-amber-400',
    },
    {
      icon: Zap,
      label: 'ENERGÍA',
      valueContent: stats.averageBattery > 0
        ? <AnimatedCounter from={0} to={stats.averageBattery} suffix="%" />
        : <>—</>,
      detail: stats.averageBattery > 0 ? 'AUTONOMÍA DE RED' : 'SIN DATOS DE BATERÍA',
      color: stats.averageBattery > 0 && stats.averageBattery < 30 ? 'text-amber-400' : 'text-zinc-400',
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
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="
              flex flex-col justify-between p-6 rounded-3xl
              glass-dark border border-white/10
              transition-all duration-300 hover:border-white/20 group
              relative overflow-hidden cursor-default
            "
          >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[50px] opacity-10 ${item.color.replace('text-', 'bg-')} transition-opacity group-hover:opacity-20 pointer-events-none`} />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">{item.label}</span>
              <motion.div
                className="opacity-50 group-hover:opacity-100 transition-opacity"
                whileHover={{ rotate: 12 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon size={24} className={item.color} />
              </motion.div>
            </div>
            
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className={`font-data text-4xl lg:text-5xl font-black tracking-tighter ${item.color} drop-shadow-sm`}>
                  {item.valueContent}
                </p>
                <p className="text-[10px] mt-2 font-bold tracking-widest uppercase text-zinc-500">{item.detail}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
