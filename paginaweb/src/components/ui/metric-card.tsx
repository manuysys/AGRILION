'use client';

import { Thermometer, Droplets, Wind, LucideIcon } from 'lucide-react';
import { formatDelta, getTrendArrow } from '@/lib/formatters';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  previous?: number;
  current: number;
  icon?: 'temperature' | 'humidity' | 'co2';
  state?: 'ok' | 'warn' | 'critical';
  sparklineData?: number[];
  compact?: boolean;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  temperature: Thermometer,
  humidity: Droplets,
  co2: Wind,
};

const stateColors = {
  ok: 'text-[var(--text-secondary)]',
  warn: 'text-[var(--state-warn)]',
  critical: 'text-[var(--state-critical)]',
};

const stateBgColors = {
  ok: 'bg-[var(--surface-1)]',
  warn: 'bg-[var(--state-warn-bg)]',
  critical: 'bg-[var(--state-critical-bg)]',
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 64;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MetricCard({
  label,
  value,
  previous,
  current,
  icon,
  state = 'ok',
  sparklineData,
  compact = false,
  className = '',
}: MetricCardProps) {
  const Icon = icon ? iconMap[icon] : null;
  const delta = formatDelta(current, previous);
  const trend = getTrendArrow(current, previous);
  const sparkColor = state === 'critical' ? '#dc2626' : state === 'warn' ? '#f59e0b' : '#16a34a';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {Icon && (
          <div className={`p-1 rounded-md ${stateBgColors[state]}`}>
            <Icon size={14} className={stateColors[state]} />
          </div>
        )}
        <div>
          <span className={`font-data text-lg font-semibold ${stateColors[state]}`}>
            {value}
          </span>
          {trend && (
            <span className={`ml-1 text-xs ${stateColors[state]}`}>{trend}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-xl border border-[var(--border-default)] bg-white p-4
        transition-shadow duration-200 hover:shadow-[var(--shadow-md)]
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-1.5 rounded-lg ${stateBgColors[state]}`}>
              <Icon size={18} className={stateColors[state]} />
            </div>
          )}
          <span className="text-sm text-[var(--text-muted)]">{label}</span>
        </div>
        {sparklineData && sparklineData.length > 2 && (
          <MiniSparkline data={sparklineData} color={sparkColor} />
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`font-data text-3xl font-bold ${stateColors[state]}`}>
          {value}
        </span>
        {delta && (
          <span className={`font-data text-sm ${stateColors[state]} opacity-70`}>
            {delta} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
