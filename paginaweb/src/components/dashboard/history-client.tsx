'use client';

import { useState } from 'react';
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
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">
          Histórico
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
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
            px-4 py-2.5 rounded-lg border border-[var(--border-default)]
            bg-white text-sm text-[var(--text-primary)]
            cursor-pointer focus:border-[var(--brand-accent)]
            outline-none transition-colors
          "
        >
          {silos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} — {s.name}
            </option>
          ))}
        </select>

        {/* Metric selector */}
        <div className="flex gap-1 bg-[var(--surface-1)] p-1 rounded-lg">
          {(['temperature', 'humidity', 'co2'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-150 cursor-pointer
                ${selectedMetric === m
                  ? 'bg-white shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              {m === 'temperature' ? 'Temperatura' : m === 'humidity' ? 'Humedad' : 'CO₂'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {silo ? (
        <div className="bg-white rounded-xl border border-[var(--border-default)] p-4 lg:p-6">
          <TimelineChart
            data={silo.readings24h}
            metric={selectedMetric}
            height={350}
          />
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-white border border-[var(--border-default)] text-center">
          <History size={32} className="text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">Seleccioná una silobolsa para ver su histórico</p>
        </div>
      )}

      {/* All silos comparison */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Comparativa entre silobolsas
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {silos.filter(s => s.state !== 'offline').slice(0, 4).map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {s.id} — {s.name}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{s.grainType}</span>
              </div>
              <TimelineChart
                data={s.readings24h}
                metric={selectedMetric}
                height={120}
                simplified
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
