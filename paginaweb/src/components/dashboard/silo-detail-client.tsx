'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Wheat, Calendar, Weight, Wifi, WifiOff, Battery, BrainCircuit, Clock } from 'lucide-react';
import type { SiloBag } from '@/types';
import StatusPill from '@/components/ui/status-pill';
import MetricCard from '@/components/ui/metric-card';
import RiskGauge from '@/components/ui/risk-gauge';
import TimelineChart from '@/components/ui/timeline-chart';
import AlertCard from '@/components/ui/alert-card';
import AnomalyBadge from '@/components/ui/anomaly-badge';
import { formatTemp, formatHumidity, formatCO2, formatRelativeTime, formatFullDate, getFreshnessColor } from '@/lib/formatters';
import { getTemperatureState, getHumidityState, getCO2State, getBatteryState } from '@/lib/thresholds';

interface SiloDetailClientProps {
  silo: SiloBag;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
};

export default function SiloDetailClient({ silo }: SiloDetailClientProps) {
  const batteryState = getBatteryState(silo.sensor.battery);
  const isCritical = silo.state === 'critical';

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6"
    >
      {/* Hero Header */}
      <motion.section
        variants={fadeUp}
        className={`
          relative overflow-hidden rounded-3xl p-8 lg:p-12 glass-dark
          border ${isCritical ? 'border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.15)]' : 'border-white/10'}
        `}
      >
        {isCritical && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors duration-150 mb-6 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Volver al resumen
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            {/* Left: Identity */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                  {silo.name}
                </h1>
                <StatusPill state={silo.state} size="lg" />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                <span className="font-data text-zinc-500">{silo.id}</span>
                <span className="flex items-center gap-1"><MapPin size={14} />{silo.location}</span>
                <span className="flex items-center gap-1"><Wheat size={14} />{silo.grainType}</span>
                <span className="flex items-center gap-1"><Weight size={14} />~{silo.estimatedTons} tn</span>
                <span className="flex items-center gap-1"><Calendar size={14} />Desde {formatFullDate(silo.storedSince)}</span>
              </div>
            </div>

            {/* Right: Risk Gauge */}
            <div className="flex items-center gap-6">
              <RiskGauge value={silo.riskScore.value} label={silo.riskScore.label} size="lg" />
            </div>
          </div>
        </div>
      </motion.section>

      {/* AI Interpretation */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-purple-500/20 bg-zinc-900/60 backdrop-blur-xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.6 }}
              className="p-1.5 rounded-lg bg-purple-500/20"
            >
              <BrainCircuit size={18} className="text-purple-400" />
            </motion.div>
            <h3 className="text-sm font-semibold text-white">
              Interpretación IA
            </h3>
            <span className="text-xs text-zinc-500 font-data ml-auto">
              Confianza: {silo.interpretation.confidence}%
            </span>
          </div>

          <p className="text-lg font-semibold text-white mb-2">
            {silo.interpretation.summary}
          </p>

          <div className="p-3 rounded-lg bg-white/5 mb-3">
            <span className="text-sm font-medium text-emerald-400">Recomendación: </span>
            <span className="text-sm text-zinc-300">{silo.interpretation.recommendation}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {silo.interpretation.factors.map((factor, i) => (
              <AnomalyBadge key={i} label={factor} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Temperatura"
          value={formatTemp(silo.currentReading.temperature)}
          current={silo.currentReading.temperature}
          previous={silo.previousReading?.temperature}
          icon="temperature"
          state={getTemperatureState(silo.currentReading.temperature)}
          sparklineData={silo.readings24h.map((r) => r.temperature)}
        />
        <MetricCard
          label="Humedad"
          value={formatHumidity(silo.currentReading.humidity)}
          current={silo.currentReading.humidity}
          previous={silo.previousReading?.humidity}
          icon="humidity"
          state={getHumidityState(silo.currentReading.humidity)}
          sparklineData={silo.readings24h.map((r) => r.humidity)}
        />
        <MetricCard
          label="CO₂"
          value={formatCO2(silo.currentReading.co2)}
          current={silo.currentReading.co2}
          previous={silo.previousReading?.co2}
          icon="co2"
          state={getCO2State(silo.currentReading.co2)}
          sparklineData={silo.readings24h.map((r) => r.co2)}
        />
      </motion.div>

      {/* Timeline Charts */}
      <motion.div variants={fadeUp} className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Evolución 24h
        </h3>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 lg:p-6">
          <TimelineChart
            data={silo.readings24h}
            metric="temperature"
            height={200}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 lg:p-6">
            <TimelineChart
              data={silo.readings24h}
              metric="humidity"
              height={180}
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 lg:p-6">
            <TimelineChart
              data={silo.readings24h}
              metric="co2"
              height={180}
            />
          </div>
        </div>
      </motion.div>

      {/* Bottom grid: Alerts + Sensor Status */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert history */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">
            Historial de Alertas
          </h3>
          {silo.alerts.length === 0 ? (
            <div className="p-8 rounded-xl glass-dark border border-white/10 text-center">
              <p className="text-sm text-zinc-500">Sin alertas registradas para este silo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {silo.alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Sensor status */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Estado del Sensor
          </h3>
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-5 space-y-4">
            {/* Connection */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Conexión</span>
              <div className="flex items-center gap-2">
                {silo.sensor.connection === 'online' ? (
                  <Wifi size={16} className="text-emerald-400" />
                ) : (
                  <WifiOff size={16} className="text-zinc-600" />
                )}
                <span className="text-sm font-medium text-white capitalize">
                  {silo.sensor.connection === 'online' ? 'Conectado' :
                   silo.sensor.connection === 'delayed' ? 'Retrasado' : 'Sin señal'}
                </span>
              </div>
            </div>

            {/* Battery */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Batería</span>
              <div className="flex items-center gap-2">
                <Battery
                  size={16}
                  className={
                    batteryState === 'critical' ? 'text-red-500' :
                    batteryState === 'low' ? 'text-amber-400' :
                    'text-emerald-400'
                  }
                />
                <span className="font-data text-sm font-medium text-white">{silo.sensor.battery}%</span>
              </div>
            </div>

            {/* Signal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Señal</span>
              <span className="font-data text-sm text-white">{silo.sensor.signalStrength} dBm</span>
            </div>

            {/* Last seen */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Última lectura</span>
              <span className={`flex items-center gap-1 text-sm font-data ${getFreshnessColor(silo.sensor.lastSeen)}`}>
                <Clock size={14} />
                {formatRelativeTime(silo.sensor.lastSeen)}
              </span>
            </div>

            {/* Battery bar */}
            <div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${silo.sensor.battery}%` }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      batteryState === 'critical' ? '#dc2626' :
                      batteryState === 'low' ? '#f59e0b' :
                      '#16a34a',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
