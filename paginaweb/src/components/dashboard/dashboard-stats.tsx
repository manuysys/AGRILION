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

// Animated sparkline using motion.polyline
function AnimatedSparkline({ data, color }: { data: number[], color: string }) {
  const [drawn, setDrawn] = useState(false);
  const width = 64;
  const height = 28;

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');

  // Area fill path
  const areaPath = `M0,${height} ` + 
    data.map((v, i) => `L${i * step},${height - ((v - min) / range) * height}`).join(' ') + 
    ` L${width},${height} Z`;

  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible">
      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={color}
        initial={{ opacity: 0 }}
        animate={{ opacity: drawn ? 0.1 : 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 0.6 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      {/* End dot */}
      {drawn && (
        <motion.circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="2.5"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 400, damping: 15 }}
        />
      )}
    </svg>
  );
}

// Generate pseudo-random but deterministic sparkline data
function generateSparkData(seed: number, trend: 'up' | 'down' | 'stable' = 'stable', points = 12): number[] {
  const data: number[] = [];
  let val = 50 + (seed * 17 % 30);
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(seed * 7 + i * 3.7) * 10 + Math.cos(seed * 13 + i * 2.3) * 5;
    const trendBias = trend === 'up' ? i * 1.5 : trend === 'down' ? -i * 1.5 : 0;
    val = val + noise * 0.3 + trendBias * 0.1;
    data.push(Math.max(0, Math.min(100, val)));
  }
  return data;
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
      sparkColor: '#34d399',
      sparkData: generateSparkData(1, 'up'),
    },
    {
      icon: Radio,
      label: 'TELEMETRÍA',
      valueContent: <><AnimatedCounter from={0} to={stats.activeSensors} /> <span className="text-xl text-zinc-500">/ {stats.totalSensors}</span></>,
      detail: 'SENSORES ONLINE',
      color: 'text-blue-400',
      sparkColor: '#60a5fa',
      sparkData: generateSparkData(2, 'stable'),
    },
    {
      icon: Bell,
      label: 'NIVEL DE RIESGO',
      valueContent: <AnimatedCounter from={0} to={stats.activeAlerts} />,
      detail: stats.criticalAlerts > 0 ? `${stats.criticalAlerts} ALERTAS CRÍTICAS` : 'SISTEMA ESTABLE',
      color: stats.criticalAlerts > 0 ? 'text-red-500' : 'text-amber-400',
      sparkColor: stats.criticalAlerts > 0 ? '#ef4444' : '#fbbf24',
      sparkData: generateSparkData(3, stats.criticalAlerts > 0 ? 'up' : 'down'),
    },
    {
      icon: Zap,
      label: 'ENERGÍA',
      valueContent: <AnimatedCounter from={0} to={stats.averageBattery} suffix="%" />,
      detail: 'AUTONOMÍA DE RED',
      color: stats.averageBattery < 30 ? 'text-amber-400' : 'text-zinc-400',
      sparkColor: stats.averageBattery < 30 ? '#fbbf24' : '#a1a1aa',
      sparkData: generateSparkData(4, stats.averageBattery < 30 ? 'down' : 'stable'),
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
              <div className="hidden sm:block">
                <AnimatedSparkline data={item.sparkData} color={item.sparkColor} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
