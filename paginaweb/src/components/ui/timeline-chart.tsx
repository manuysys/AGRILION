'use client';

import React, { useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { formatChartTime } from '@/lib/formatters';
import type { SensorReading } from '@/types';

interface TimelineChartProps {
  data: SensorReading[];
  metric: 'temperature' | 'humidity' | 'co2' | 'pressure';
  thresholds?: { warn: number; critical: number };
  height?: number;
  showGrid?: boolean;
  simplified?: boolean;
  showThresholds?: boolean;
  className?: string;
}

const metricConfig = {
  temperature: {
    key: 'temperature' as const,
    label: 'Temperatura',
    unit: '°C',
    color: '#ef4444',
    warnDefault: 28,
    critDefault: 35,
  },
  humidity: {
    key: 'humidity' as const,
    label: 'Humedad',
    unit: '%',
    color: '#3b82f6',
    warnDefault: 70,
    critDefault: 80,
  },
  co2: {
    key: 'co2' as const,
    label: 'CO₂',
    unit: 'ppm',
    color: '#8b5cf6',
    warnDefault: 600,
    critDefault: 1200,
  },
  pressure: {
    key: 'pressure' as const,
    label: 'Presión',
    unit: 'hPa',
    color: '#0ea5e9',
    warnDefault: 950,
    critDefault: 1050,
  },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-dark rounded-lg px-3 py-2 shadow-lg border border-white/10">
      <p className="text-xs text-zinc-500 font-data mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold font-data text-white">
        {payload[0].value}
      </p>
    </div>
  );
}

export default function TimelineChart({
  data,
  metric,
  thresholds,
  height = 240,
  showGrid = true,
  simplified = false,
  showThresholds = true,
  className = '',
}: TimelineChartProps) {
  // Client-only render guard for Recharts (avoids SSR hydration mismatch)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const cfg = metricConfig[metric];
  const warnThreshold = thresholds?.warn ?? cfg.warnDefault;
  const critThreshold = thresholds?.critical ?? cfg.critDefault;
  const thresholdsVisible = showThresholds && metric !== 'pressure';

  const chartData = data.map((d) => ({
    time: formatChartTime(d.timestamp),
    value: d[cfg.key],
  }));

  const values = chartData.map((d) => d.value);
  const noCO2Data =
    metric === 'co2' &&
    values.every((v) => typeof v !== 'number' || !Number.isFinite(v) || v <= 0);

  if (noCO2Data) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-white/10 bg-zinc-900/40 px-4 text-sm text-zinc-500 ${className}`}
        style={{ minHeight: height }}
      >
        Sin datos de CO₂ (sensor no disponible)
      </div>
    );
  }

  const numericValues = values.filter((v): v is number => Number.isFinite(v));
  const minValue = thresholdsVisible
    ? Math.min(...numericValues, warnThreshold * 0.85)
    : Math.min(...numericValues) - 5;
  const maxValue = thresholdsVisible
    ? Math.max(...numericValues, critThreshold * 1.1)
    : Math.max(...numericValues) + 5;

  if (simplified) {
    // Simple line for mobile / compact views
    return (
      <div className={className} style={{ minHeight: height, width: '100%' }}>
        {mounted && (
          <ResponsiveContainer width="100%" height={height} minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine
                y={warnThreshold}
                stroke="var(--state-warn)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ minHeight: height + 40, width: '100%' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-zinc-400">
          {cfg.label} ({cfg.unit})
        </h4>
        {thresholdsVisible && (
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded-full bg-[var(--state-warn)]" />
              Advertencia ({warnThreshold}{cfg.unit})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded-full bg-[var(--state-critical)]" />
              Crítico ({critThreshold}{cfg.unit})
            </span>
          </div>
        )}
      </div>

      <div style={{ width: '100%', height, minHeight: height }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 10, right: 45, bottom: 5, left: -10 }}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
              )}

              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: 'rgba(161,161,170,0.8)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval="preserveStartEnd"
                minTickGap={50}
              />

              <YAxis
                domain={[minValue, maxValue]}
                tick={{ fontSize: 11, fill: 'rgba(161,161,170,0.8)' }}
                tickLine={false}
                axisLine={false}
                width={metric === 'pressure' ? 55 : 40}
                tickFormatter={(v: number) => metric === 'pressure' ? Math.round(v).toString() : String(v)}
              />

              <Tooltip content={<CustomTooltip />} />

              {thresholdsVisible && (
                <>
                  {/* Warning zone */}
                  <ReferenceArea
                    y1={warnThreshold}
                    y2={critThreshold}
                    fill="var(--state-warn)"
                    fillOpacity={0.06}
                  />

                  {/* Critical zone */}
                  <ReferenceArea
                    y1={critThreshold}
                    y2={maxValue}
                    fill="var(--state-critical)"
                    fillOpacity={0.06}
                  />

                  {/* Threshold lines */}
                  <ReferenceLine
                    y={warnThreshold}
                    stroke="var(--state-warn)"
                    strokeDasharray="6 3"
                    strokeWidth={1}
                    label={{
                      value: `${warnThreshold}`,
                      position: 'right',
                      fontSize: 10,
                      fill: 'var(--state-warn)',
                    }}
                  />
                  <ReferenceLine
                    y={critThreshold}
                    stroke="var(--state-critical)"
                    strokeDasharray="6 3"
                    strokeWidth={1}
                    label={{
                      value: `${critThreshold}`,
                      position: 'right',
                      fontSize: 10,
                      fill: 'var(--state-critical)',
                    }}
                  />
                </>
              )}

              {/* Data line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: 'white',
                  stroke: cfg.color,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
