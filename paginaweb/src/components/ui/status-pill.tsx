'use client';

import { CheckCircle, AlertTriangle, XCircle, WifiOff } from 'lucide-react';
import type { HealthState } from '@/types';

interface StatusPillProps {
  state: HealthState;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const config: Record<HealthState, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ElementType;
}> = {
  ok: {
    label: 'Estable',
    bg: 'bg-[var(--state-ok-bg)]',
    text: 'text-[var(--state-ok)]',
    border: 'border-[var(--state-ok)]',
    icon: CheckCircle,
  },
  warn: {
    label: 'Atención',
    bg: 'bg-[var(--state-warn-bg)]',
    text: 'text-[var(--state-warn)]',
    border: 'border-[var(--state-warn)]',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Crítico',
    bg: 'bg-[var(--state-critical-bg)]',
    text: 'text-[var(--state-critical)]',
    border: 'border-[var(--state-critical)]',
    icon: XCircle,
  },
  offline: {
    label: 'Sin señal',
    bg: 'bg-[var(--state-offline-bg)]',
    text: 'text-[var(--state-offline)]',
    border: 'border-[var(--state-offline)]',
    icon: WifiOff,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = { sm: 12, md: 14, lg: 16 };

export default function StatusPill({
  state,
  size = 'md',
  showIcon = true,
  className = '',
}: StatusPillProps) {
  const c = config[state];
  const Icon = c.icon;

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${c.bg} ${c.text} ${c.border} border-opacity-30
        ${sizeClasses[size]}
        ${state === 'critical' ? 'pulse-critical' : ''}
        ${className}
      `}
    >
      {showIcon && <Icon size={iconSizes[size]} strokeWidth={2.5} />}
      {c.label}
    </span>
  );
}
