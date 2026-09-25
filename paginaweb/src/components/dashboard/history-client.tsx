'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import type { SiloBag } from '@/types';
import TimelineChart from '@/components/ui/timeline-chart';

interface HistoryClientProps {
  silos: SiloBag[];
}

export default function HistoryClient({ silos }: HistoryClientProps) {
  const [selectedSilo, setSelectedSilo] = useState(silos[0]?.id ?? '');
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'humidity' | 'co2'>('temperature');

  const silo = silos.find((s) => s.id === selectedSilo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Histórico
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Series temporales y comparativas de sensores
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Silo selector */}
        <select
          value={selectedSilo}
          onChange={(e) => setSelectedSilo(e.target.value)}
          className="
            px-4 py-2.5 rounded-xl border border-white/10
            bg-zinc-900/60 backdrop-blur-xl text-sm text-white
            cursor-pointer focus:border-emerald-500/50
            outline-none transition-colors
          "
        >
          {silos.map((s) => (
            <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
              {s.id} — {s.name}
            </option>
          ))}
        </select>

        {/* Metric selector */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['temperature', 'humidity', 'co2'] as const).map((m) => {
            const isActive = selectedMetric === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`
                  relative px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150 cursor-pointer
                  ${isActive
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-metric-tab"
                    className="absolute inset-0 rounded-lg bg-white/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {m === 'temperature' ? 'Temperatura' : m === 'humidity' ? 'Humedad' : 'CO₂'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {silo ? (
        <motion.div
          key={`${selectedSilo}-${selectedMetric}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 lg:p-6"
        >
          <TimelineChart
            data={silo.readings24h}
            metric={selectedMetric}
            height={350}
          />
        </motion.div>
      ) : (
        <div className="p-12 rounded-2xl glass-dark border border-white/10 text-center">
          <History size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Seleccioná una silobolsa para ver su histórico</p>
        </div>
      )}

      {/* All silos comparison */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Comparativa entre silobolsas
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {silos.filter(s => s.state !== 'offline').slice(0, 4).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {s.id} — {s.name}
                </span>
                <span className="text-xs text-zinc-500">{s.grainType}</span>
              </div>
              <TimelineChart
                data={s.readings24h}
                metric={selectedMetric}
                height={120}
                simplified
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
