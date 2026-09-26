'use client';

import { useEffect, useState } from 'react';
import { getRiskBand, THRESHOLDS } from '@/lib/thresholds';

interface RiskGaugeProps {
  value: number; // 0-100
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { width: 100, height: 60, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { width: 160, height: 95, strokeWidth: 10, fontSize: 'text-3xl', labelSize: 'text-sm' },
  lg: { width: 220, height: 130, strokeWidth: 12, fontSize: 'text-4xl', labelSize: 'text-base' },
};

function getColor(value: number): string {
  const band = getRiskBand(value);
  if (band === 'danger') return 'var(--state-critical)';
  if (band === 'warning') return 'var(--state-warn)';
  return 'var(--state-ok)';
}

function getBandLabel(value: number): string {
  const band = getRiskBand(value);
  if (band === 'danger') return 'Crítico';
  if (band === 'warning') return 'Atención';
  return 'Estable';
}

export default function RiskGauge({
  value,
  label,
  size = 'md',
  className = '',
}: RiskGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const cfg = sizeConfig[size];
  const color = getColor(value);
  const bandLabel = label || getBandLabel(value);

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  // SVG arc math
  const cx = cfg.width / 2;
  const cy = cfg.height - 5;
  const radius = cx - cfg.strokeWidth;
  const circumference = Math.PI * radius;
  const progress = (animatedValue / 100) * circumference;

  // Proporciones de las bandas (alineadas con THRESHOLDS.riskScore)
  const normalPct = THRESHOLDS.riskScore.normal.max / 100; // 0-30
  const warnPct = (THRESHOLDS.riskScore.warning.max - THRESHOLDS.riskScore.warning.min) / 100; // 30-70
  const dangerPct = 1 - normalPct - warnPct; // 70-100

  const arcPath = `
    M ${cfg.strokeWidth} ${cy}
    A ${radius} ${radius} 0 0 1 ${cfg.width - cfg.strokeWidth} ${cy}
  `;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={cfg.width}
        height={cfg.height}
        viewBox={`0 0 ${cfg.width} ${cfg.height}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={cfg.strokeWidth}
          strokeLinecap="round"
        />

        {/* Green band (0-30) */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--state-ok)"
          strokeWidth={cfg.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${normalPct * circumference} ${circumference}`}
          opacity={0.15}
        />

        {/* Yellow band (30-70) */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--state-warn)"
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={`${warnPct * circumference} ${circumference}`}
          strokeDashoffset={`${-normalPct * circumference}`}
          opacity={0.15}
        />

        {/* Red band (70-100) */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--state-critical)"
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={`${dangerPct * circumference} ${circumference}`}
          strokeDashoffset={`${-(normalPct + warnPct) * circumference}`}
          opacity={0.15}
        />

        {/* Active progress */}
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth={cfg.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{
            transition: 'stroke-dasharray 1s ease-out, stroke 0.3s ease',
          }}
        />

        {/* Value text */}
        <text
          x={cx}
          y={cy - (size === 'sm' ? 12 : size === 'md' ? 20 : 28)}
          textAnchor="middle"
          className="font-data font-bold"
          fill={color}
          fontSize={size === 'sm' ? 20 : size === 'md' ? 32 : 42}
        >
          {Math.round(animatedValue)}
        </text>

        {/* /100 label */}
        <text
          x={cx}
          y={cy - (size === 'sm' ? 2 : size === 'md' ? 4 : 8)}
          textAnchor="middle"
          fill="rgba(161,161,170,0.5)"
          fontSize={size === 'sm' ? 9 : size === 'md' ? 12 : 14}
        >
          / 100
        </text>
      </svg>

      {/* Band label */}
      <span
        className={`${cfg.labelSize} font-semibold mt-1`}
        style={{ color }}
      >
        {bandLabel}
      </span>
    </div>
  );
}
