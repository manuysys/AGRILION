'use client';

import Link from 'next/link';
import { Battery, Clock, ChevronRight } from 'lucide-react';
import type { SiloBag } from '@/types';
import StatusPill from './status-pill';
import MetricCard from './metric-card';
import { formatRelativeTime, formatTemp, formatHumidity, formatCO2, getFreshnessColor } from '@/lib/formatters';
import { getTemperatureState, getHumidityState, getCO2State, getBatteryState } from '@/lib/thresholds';

interface SiloCardProps {
  silo: SiloBag;
  rank?: number;
  className?: string;
}

export default function SiloCard({ silo, rank, className = '' }: SiloCardProps) {
  const batteryState = getBatteryState(silo.sensor.battery);
  const freshnessColor = getFreshnessColor(silo.sensor.lastSeen);

  return (
    <Link
      href={`/dashboard/silo/${silo.id}`}
      className={`
        block rounded-3xl border border-white/5 glass-dark
        p-6 min-h-[96px]
        transition-all duration-300
        hover:shadow-2xl hover:bg-white/5
        cursor-pointer
        ${silo.state === 'critical' ? 'pulse-critical border-red-500/30 bg-red-950/20' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: rank + info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {rank !== undefined && (
            <span className="
              font-data text-sm font-bold text-zinc-400
              w-8 h-8 flex items-center justify-center shrink-0
              rounded-full bg-white/5 border border-white/10
            ">
              {rank}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <StatusPill state={silo.state} size="sm" />
              <span className="font-data text-xs text-zinc-500 tracking-widest uppercase truncate">
                {silo.id}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white truncate tracking-tight">
              {silo.name}
            </h3>

            <p className="text-sm text-zinc-400 mt-1 truncate font-light">
              {silo.grainType} <span className="mx-2 text-zinc-600">·</span> {silo.location}
            </p>
          </div>
        </div>

        {/* Right: metrics */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden sm:flex items-center gap-6">
            <MetricCard
              label="Temp"
              value={formatTemp(silo.currentReading.temperature)}
              current={silo.currentReading.temperature}
              previous={silo.previousReading?.temperature}
              icon="temperature"
              state={getTemperatureState(silo.currentReading.temperature)}
              compact
            />
            <MetricCard
              label="Hum"
              value={formatHumidity(silo.currentReading.humidity)}
              current={silo.currentReading.humidity}
              previous={silo.previousReading?.humidity}
              icon="humidity"
              state={getHumidityState(silo.currentReading.humidity)}
              compact
            />
            <MetricCard
              label="CO₂"
              value={formatCO2(silo.currentReading.co2)}
              current={silo.currentReading.co2}
              previous={silo.previousReading?.co2}
              icon="co2"
              state={getCO2State(silo.currentReading.co2)}
              compact
            />
          </div>

          <ChevronRight size={24} className="text-zinc-600 shrink-0" />
        </div>
      </div>

      {/* Bottom row: mobile metrics + meta */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        {/* Mobile-only compact metrics */}
        <div className="flex sm:hidden items-center gap-4">
          <span className={`font-data text-sm font-bold ${getTemperatureState(silo.currentReading.temperature) === 'critical' ? 'text-red-500' : getTemperatureState(silo.currentReading.temperature) === 'warn' ? 'text-amber-500' : 'text-zinc-300'}`}>
            {formatTemp(silo.currentReading.temperature)}
          </span>
          <span className={`font-data text-sm font-bold ${getHumidityState(silo.currentReading.humidity) === 'critical' ? 'text-red-500' : getHumidityState(silo.currentReading.humidity) === 'warn' ? 'text-amber-500' : 'text-zinc-300'}`}>
            {formatHumidity(silo.currentReading.humidity)}
          </span>
          <span className={`font-data text-sm font-bold ${getCO2State(silo.currentReading.co2) === 'critical' ? 'text-red-500' : getCO2State(silo.currentReading.co2) === 'warn' ? 'text-amber-500' : 'text-zinc-300'}`}>
            {formatCO2(silo.currentReading.co2)}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 ml-auto tracking-wide">
          <span className="flex items-center gap-1.5">
            <Battery size={14} className={batteryState === 'critical' ? 'text-red-500' : batteryState === 'low' ? 'text-amber-500' : ''} />
            <span className="font-data font-medium">{silo.sensor.battery}%</span>
          </span>
          <span className={`flex items-center gap-1.5 ${freshnessColor}`}>
            <Clock size={14} />
            <span className="font-data font-medium">{formatRelativeTime(silo.sensor.lastSeen)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
