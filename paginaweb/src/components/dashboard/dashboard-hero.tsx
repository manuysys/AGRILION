'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { SiloBag } from '@/types';
import { formatTemp, formatHumidity } from '@/lib/formatters';
import { WebGLShader } from '@/components/ui/web-gl-shader';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface DashboardHeroProps {
  systemState: 'ok' | 'warn' | 'critical';
  summary: string;
  detail: string;
  criticalSilo: SiloBag | null;
}

const stateConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgBadge: 'bg-red-500/20 border-red-500/30',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgBadge: 'bg-amber-500/20 border-amber-500/30',
  },
  ok: {
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bgBadge: 'bg-emerald-500/20 border-emerald-500/30',
  },
};

export default function DashboardHero({
  systemState,
  summary,
  detail,
  criticalSilo,
}: DashboardHeroProps) {
  const cfg = stateConfig[systemState];
  const Icon = cfg.icon;
  const isCritical = systemState === 'critical';
  const isWarn = systemState === 'warn';

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`
        relative overflow-hidden rounded-3xl text-white min-h-[300px] flex flex-col justify-end p-8 lg:p-12 shadow-2xl glass-dark
        border-2 transition-all duration-1000
        ${isCritical ? 'border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-pulse' : 
          isWarn ? 'border-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.1)]' : 
          'border-emerald-500/30'}
      `}
    >
      {/* Background Shader / Gradients */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        {systemState === 'ok' && <WebGLShader />}
      </div>
      <div className={`absolute inset-0 z-0 opacity-30 bg-gradient-to-t ${isCritical ? 'from-red-900 via-red-950/50' : isWarn ? 'from-amber-900 via-amber-950/50' : 'from-emerald-900'} to-transparent pointer-events-none`} />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
        
        {/* Left side: Global Status */}
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border backdrop-blur-md mb-6 ${cfg.bgBadge}`}
          >
             <Icon size={24} className={`${cfg.color} ${isCritical ? 'animate-bounce' : ''}`} />
             <span className="font-bold uppercase tracking-widest text-sm text-white">
               ESTADO GLOBAL DEL SISTEMA
             </span>
          </motion.div>

          <h1 className={`text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4 uppercase ${isCritical ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''}`}>
            {summary}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 font-light max-w-2xl leading-relaxed">
            {detail}
          </p>
        </div>

        {/* Right side: Critical Radar / Stats */}
        {criticalSilo && isCritical && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex-shrink-0 w-full lg:w-auto p-6 rounded-2xl bg-black/60 border border-red-500/50 backdrop-blur-xl shadow-[inset_0_0_30px_rgba(239,68,68,0.1)]"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-red-500/30 pb-4">
               <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
               <span className="text-xs font-bold uppercase tracking-widest text-red-400">OBJETIVO CRÍTICO DETECTADO</span>
            </div>

            <div className="grid grid-cols-2 sm:flex items-end gap-8 mb-8">
              <div className="flex flex-col">
                 <span className="text-xs uppercase tracking-widest text-zinc-500 mb-1">ID Silobolsa</span>
                 <span className="text-4xl font-black font-data text-white">{criticalSilo.id}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Temp</span>
                 <span className="text-4xl font-black font-data text-red-500">{formatTemp(criticalSilo.currentReading.temperature)}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Humedad</span>
                 <span className="text-4xl font-black font-data text-red-500">{formatHumidity(criticalSilo.currentReading.humidity)}</span>
              </div>
            </div>
            
            <Link href={`/dashboard/silo/${criticalSilo.id}`} className="block w-full">
              <LiquidButton className="w-full bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-4 text-lg">
                INICIAR PROTOCOLO <ArrowRight size={20} className="ml-2 inline" />
              </LiquidButton>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
