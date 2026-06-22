'use client';

import { useEffect, useState } from 'react';

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
  if (value > 35) return 'var(--state-critical)';
  if (value > 30) return 'var(--state-warn)';
  return 'var(--state-ok)';
}

function getBandLabel(value: number): string {
  if (value > 35) return 'Crítico';
  if (value > 30) return 'Atención';
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
          stroke="var(--border-default)"
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
          strokeDasharray={`${0.30 * circumference} ${circumference}`}
          opacity={0.15}
        />

        {/* Yellow band (30-35) */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--state-warn)"
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={`${0.05 * circumference} ${circumference}`}
          strokeDashoffset={`${-0.30 * circumference}`}
          opacity={0.15}
        />

        {/* Red band (35-100) */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--state-critical)"
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={`${0.65 * circumference} ${circumference}`}
          strokeDashoffset={`${-0.35 * circumference}`}
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
          fill="var(--text-muted)"
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
