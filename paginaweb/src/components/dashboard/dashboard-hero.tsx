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

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/10 text-white min-h-[300px] flex flex-col justify-end p-8 lg:p-12 shadow-2xl glass-dark"
    >
      {/* Background Shader / Gradients */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        {systemState === 'ok' && <WebGLShader />}
      </div>
      <div className={`absolute inset-0 z-0 opacity-20 bg-gradient-to-t ${systemState === 'critical' ? 'from-red-900' : systemState === 'warn' ? 'from-amber-900' : 'from-emerald-900'} to-transparent pointer-events-none`} />

      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md mb-6 ${cfg.bgBadge}`}
        >
           <Icon size={20} className={cfg.color} />
           <span className="font-semibold uppercase tracking-widest text-sm text-white/90">
             ESTADO DEL SISTEMA
           </span>
        </motion.div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight mb-4">
          {summary.toUpperCase()}
        </h1>
        <p className="text-lg md:text-xl text-white/60 font-light max-w-2xl leading-relaxed">
          {detail}
        </p>

        {criticalSilo && criticalSilo.state === 'critical' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-black/40 border border-red-500/20 backdrop-blur-xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-xs uppercase tracking-widest text-white/50">Silobolsa Crítica</span>
                 <span className="text-2xl font-bold font-data text-red-400">{criticalSilo.id}</span>
              </div>
              <div className="h-12 w-px bg-white/10 hidden sm:block" />
              <div className="flex gap-8">
                 <div className="flex flex-col">
                   <span className="text-xs uppercase tracking-widest text-white/50">Temp</span>
                   <span className="text-2xl font-bold font-data text-red-400">{formatTemp(criticalSilo.currentReading.temperature)}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs uppercase tracking-widest text-white/50">Humedad</span>
                   <span className="text-2xl font-bold font-data text-red-400">{formatHumidity(criticalSilo.currentReading.humidity)}</span>
                 </div>
              </div>
            </div>
            
            <div className="sm:ml-auto">
               <Link href={`/dashboard/silo/${criticalSilo.id}`}>
                 <LiquidButton className="bg-red-600/20 hover:bg-red-600/40 text-red-100 border border-red-500/50 px-6 py-3 text-lg">
                   Ver Alerta <ArrowRight size={20} className="ml-2 inline" />
                 </LiquidButton>
               </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
