'use client';

import Link from 'next/link';
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

export default function SiloDetailClient({ silo }: SiloDetailClientProps) {
  const batteryState = getBatteryState(silo.sensor.battery);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="
              inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]
              hover:text-[var(--text-primary)] transition-colors duration-150
              mb-3 cursor-pointer
            "
          >
            <ArrowLeft size={16} />
            Volver al resumen
          </Link>

          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">
              {silo.name}
            </h1>
            <StatusPill state={silo.state} size="lg" />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
            <span className="font-data">{silo.id}</span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {silo.location}
            </span>
            <span className="flex items-center gap-1">
              <Wheat size={14} />
              {silo.grainType}
            </span>
            <span className="flex items-center gap-1">
              <Weight size={14} />
              ~{silo.estimatedTons} tn
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              Desde {formatFullDate(silo.storedSince)}
            </span>
          </div>
        </div>
      </div>

      {/* Risk + AI Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Gauge */}
        <div className="bg-white rounded-xl border border-[var(--border-default)] p-6 flex flex-col items-center justify-center">
          <RiskGauge value={silo.riskScore.value} label={silo.riskScore.label} size="lg" />
          <p className="text-xs text-[var(--text-muted)] mt-2">Score de riesgo IA</p>
        </div>

        {/* AI Interpretation */}
        <div className="md:col-span-2 bg-white rounded-xl border border-[var(--border-default)] p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-50">
              <BrainCircuit size={18} className="text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Interpretación IA
            </h3>
            <span className="text-xs text-[var(--text-muted)] font-data ml-auto">
              Confianza: {silo.interpretation.confidence}%
            </span>
          </div>

          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {silo.interpretation.summary}
          </p>

          <div className="p-3 rounded-lg bg-[var(--surface-1)] mb-3">
            <span className="text-sm font-medium text-[var(--brand-primary)]">Recomendación: </span>
            <span className="text-sm text-[var(--text-secondary)]">{silo.interpretation.recommendation}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {silo.interpretation.factors.map((factor, i) => (
              <AnomalyBadge key={i} label={factor} />
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div>

      {/* Timeline Charts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Evolución 24h
        </h3>

        <div className="bg-white rounded-xl border border-[var(--border-default)] p-4 lg:p-6">
          <TimelineChart
            data={silo.readings24h}
            metric="temperature"
            height={200}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border-default)] p-4 lg:p-6">
            <TimelineChart
              data={silo.readings24h}
              metric="humidity"
              height={180}
            />
          </div>
          <div className="bg-white rounded-xl border border-[var(--border-default)] p-4 lg:p-6">
            <TimelineChart
              data={silo.readings24h}
              metric="co2"
              height={180}
            />
          </div>
        </div>
      </div>

      {/* Bottom grid: Alerts + Sensor Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert history */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Historial de Alertas
          </h3>
          {silo.alerts.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-[var(--border-default)] text-center">
              <p className="text-sm text-[var(--text-muted)]">Sin alertas registradas para este silo</p>
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
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Estado del Sensor
          </h3>
          <div className="bg-white rounded-xl border border-[var(--border-default)] p-5 space-y-4">
            {/* Connection */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Conexión</span>
              <div className="flex items-center gap-2">
                {silo.sensor.connection === 'online' ? (
                  <Wifi size={16} className="text-[var(--state-ok)]" />
                ) : (
                  <WifiOff size={16} className="text-[var(--state-offline)]" />
                )}
                <span className="text-sm font-medium capitalize">
                  {silo.sensor.connection === 'online' ? 'Conectado' :
                   silo.sensor.connection === 'delayed' ? 'Retrasado' : 'Sin señal'}
                </span>
              </div>
            </div>

            {/* Battery */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Batería</span>
              <div className="flex items-center gap-2">
                <Battery
                  size={16}
                  className={
                    batteryState === 'critical' ? 'text-[var(--state-critical)]' :
                    batteryState === 'low' ? 'text-[var(--state-warn)]' :
                    'text-[var(--state-ok)]'
                  }
                />
                <span className="font-data text-sm font-medium">{silo.sensor.battery}%</span>
              </div>
            </div>

            {/* Signal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Señal</span>
              <span className="font-data text-sm">{silo.sensor.signalStrength} dBm</span>
            </div>

            {/* Last seen */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Última lectura</span>
              <span className={`flex items-center gap-1 text-sm font-data ${getFreshnessColor(silo.sensor.lastSeen)}`}>
                <Clock size={14} />
                {formatRelativeTime(silo.sensor.lastSeen)}
              </span>
            </div>

            {/* Battery bar */}
            <div>
              <div className="h-2 rounded-full bg-[var(--surface-1)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${silo.sensor.battery}%`,
                    backgroundColor:
                      batteryState === 'critical' ? 'var(--state-critical)' :
                      batteryState === 'low' ? 'var(--state-warn)' :
                      'var(--state-ok)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
