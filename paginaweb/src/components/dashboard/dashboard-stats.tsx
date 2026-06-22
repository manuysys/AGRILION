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

// Generates a simple mock SVG sparkline
function Sparkline({ color, isNegative }: { color: string, isNegative?: boolean }) {
  const points = isNegative 
    ? "0,10 5,15 10,8 15,20 20,18 25,25 30,22" 
    : "0,20 5,15 10,18 15,10 20,12 25,5 30,2";
  
  return (
    <svg width="60" height="30" viewBox="0 0 30 30" className="opacity-40">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className={color}
      />
    </svg>
  );
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
      detail: 'MONITOREADAS EN VIVO',
      color: 'text-emerald-400',
      sparkline: <Sparkline color="text-emerald-400" />
    },
    {
      icon: Radio,
      label: 'TELEMETRÍA',
      valueContent: <><AnimatedCounter from={0} to={stats.activeSensors} /> <span className="text-xl text-zinc-500">/ {stats.totalSensors}</span></>,
      detail: 'SENSORES ONLINE',
      color: 'text-blue-400',
      sparkline: <Sparkline color="text-blue-400" />
    },
    {
      icon: Bell,
      label: 'NIVEL DE RIESGO',
      valueContent: <AnimatedCounter from={0} to={stats.activeAlerts} />,
      detail: stats.criticalAlerts > 0 ? `${stats.criticalAlerts} ALERTAS CRÍTICAS` : 'SISTEMA ESTABLE',
      color: stats.criticalAlerts > 0 ? 'text-red-500' : 'text-amber-400',
      sparkline: <Sparkline color={stats.criticalAlerts > 0 ? "text-red-500" : "text-amber-400"} isNegative={stats.criticalAlerts > 0} />
    },
    {
      icon: Zap,
      label: 'ENERGÍA',
      valueContent: <AnimatedCounter from={0} to={stats.averageBattery} suffix="%" />,
      detail: 'AUTONOMÍA DE RED',
      color: stats.averageBattery < 30 ? 'text-amber-400' : 'text-zinc-400',
      sparkline: <Sparkline color={stats.averageBattery < 30 ? "text-amber-400" : "text-zinc-400"} isNegative={stats.averageBattery < 30} />
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
              glass-dark border border-white/10
              transition-all duration-300 hover:bg-white/5 hover:border-white/20 group
              relative overflow-hidden
            "
          >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[50px] opacity-10 ${item.color.replace('text-', 'bg-')} transition-opacity group-hover:opacity-20 pointer-events-none`} />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">{item.label}</span>
              <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                <Icon size={24} className={item.color} />
              </div>
            </div>
            
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className={`font-data text-4xl lg:text-5xl font-black tracking-tighter ${item.color} drop-shadow-sm`}>
                  {item.valueContent}
                </p>
                <p className="text-[10px] mt-2 font-bold tracking-widest uppercase text-zinc-500">{item.detail}</p>
              </div>
              <div className="hidden sm:block">
                {item.sparkline}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
