'use client';

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
  metric: 'temperature' | 'humidity' | 'co2';
  thresholds?: { warn: number; critical: number };
  height?: number;
  showGrid?: boolean;
  simplified?: boolean;
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
    warnDefault: 14,
    critDefault: 17,
  },
  co2: {
    key: 'co2' as const,
    label: 'CO₂',
    unit: 'ppm',
    color: '#8b5cf6',
    warnDefault: 600,
    critDefault: 800,
  },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass rounded-lg px-3 py-2 shadow-lg border border-[var(--border-default)]">
      <p className="text-xs text-[var(--text-muted)] font-data mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold font-data text-[var(--text-primary)]">
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
  className = '',
}: TimelineChartProps) {
  const cfg = metricConfig[metric];
  const warnThreshold = thresholds?.warn ?? cfg.warnDefault;
  const critThreshold = thresholds?.critical ?? cfg.critDefault;

  const chartData = data.map((d) => ({
    time: formatChartTime(d.timestamp),
    value: d[cfg.key],
  }));

  const values = chartData.map((d) => d.value);
  const minValue = Math.min(...values, warnThreshold * 0.85);
  const maxValue = Math.max(...values, critThreshold * 1.1);

  if (simplified) {
    // Simple line for mobile / compact views
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={cfg.color}
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine
              y={warnThreshold}
              stroke="var(--state-warn)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-[var(--text-secondary)]">
          {cfg.label} ({cfg.unit})
        </h4>
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 rounded-full bg-[var(--state-warn)]" />
            Advertencia ({warnThreshold}{cfg.unit})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 rounded-full bg-[var(--state-critical)]" />
            Crítico ({critThreshold}{cfg.unit})
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[minValue, maxValue]}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} />

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

          {/* Data line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={cfg.color}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              fill: 'white',
              stroke: cfg.color,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
