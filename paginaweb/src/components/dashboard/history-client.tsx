'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Loader2 } from 'lucide-react';
import type { SiloBag, SensorReading } from '@/types';
import TimelineChart from '@/components/ui/timeline-chart';
import { getCurrentIdToken } from '@/lib/auth-client';

interface HistoryClientProps {
  silos: SiloBag[];
}

export default function HistoryClient({ silos }: HistoryClientProps) {
  const [selectedSilo, setSelectedSilo] = useState(silos[0]?.id ?? '');
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'humidity' | 'co2' | 'pressure'>('temperature');
  const [hours, setHours] = useState(24);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const silo = silos.find((s) => s.id === selectedSilo);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // Se difiere el trabajo al próximo tick para no encadenar renders
    // sincrónicos dentro del efecto.
    const timer = window.setTimeout(async () => {
      if (cancelled) return;

      if (!selectedSilo) {
        setReadings([]);
        setLoading(false);
        setError(null);
        return;
      }

      const isDemo = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';
      if (isDemo) {
        setReadings(silo?.readings24h ?? []);
        setLoading(false);
        setError(null);
        return;
      }

      const token = await getCurrentIdToken();
      if (!token) {
        setLoading(false);
        setError('Sesión vencida. Volvé a iniciar sesión.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/ai/silos/${encodeURIComponent(selectedSilo)}/history?hours=${hours}`,
          {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const history = Array.isArray(data?.history) ? data.history : [];
        setReadings(
          history.map((h: { timestamp: string; temperature: number; humidity: number; co2: number; pressure?: number | null }) => ({
            timestamp: h.timestamp,
            temperature: Number(h.temperature ?? 0),
            humidity: Number(h.humidity ?? 0),
            co2: Number(h.co2 ?? 0),
            pressure: h.pressure === null || h.pressure === undefined ? null : Number(h.pressure),
          }))
        );
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Error al cargar el historial');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedSilo, hours, silo?.readings24h]);

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

        {/* Time range */}
        <select
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          aria-label="Rango de tiempo"
          className="
            px-4 py-2.5 rounded-xl border border-white/10
            bg-zinc-900/60 backdrop-blur-xl text-sm text-white
            cursor-pointer focus:border-emerald-500/50
            outline-none transition-colors
          "
        >
          <option value={24} className="bg-zinc-900 text-white">24 h</option>
          <option value={168} className="bg-zinc-900 text-white">7 días</option>
          <option value={720} className="bg-zinc-900 text-white">30 días</option>
        </select>

        {/* Metric selector */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['temperature', 'humidity', 'co2', 'pressure'] as const).map((m) => {
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
                  {m === 'temperature' ? 'Temperatura' : m === 'humidity' ? 'Humedad' : m === 'co2' ? 'CO₂' : 'Presión'}
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
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 lg:p-6"
        >
          {loading ? (
            <div className="flex items-center justify-center text-sm text-zinc-500" style={{ minHeight: 390 }}>
              <Loader2 size={18} className="animate-spin mr-2" />
              Cargando histórico...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center text-sm text-red-400" style={{ minHeight: 390 }}>
              {error}
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-sm text-zinc-500" style={{ minHeight: 390 }}>
              <History size={28} className="text-zinc-600 mb-2" />
              Aún no hay lecturas guardadas para {selectedSilo}
            </div>
          ) : (
            <TimelineChart
              data={readings}
              metric={selectedMetric}
              height={350}
            />
          )}
        </motion.div>
      ) : (
        <div className="p-12 rounded-2xl glass-dark border border-white/10 text-center">
          <History size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Seleccioná una silobolsa para ver su histórico</p>
        </div>
      )}
    </motion.div>
  );
}
