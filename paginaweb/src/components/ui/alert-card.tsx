'use client';

import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, CheckCircle, XCircle, ArrowRight, Eye, LucideIcon } from 'lucide-react';
import type { Alert, AlertSeverity } from '@/types';
import { formatRelativeTime } from '@/lib/formatters';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  compact?: boolean;
  className?: string;
}

const severityConfig: Record<AlertSeverity, {
  icon: LucideIcon;
  borderColor: string;
  bgColor: string;
  textColor: string;
  label: string;
}> = {
  critical: {
    icon: XCircle,
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    label: 'CRÍTICA',
  },
  high: {
    icon: AlertCircle,
    borderColor: 'border-l-red-400',
    bgColor: 'bg-red-400/10',
    textColor: 'text-red-400',
    label: 'ALTA',
  },
  medium: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    label: 'MEDIA',
  },
  low: {
    icon: Info,
    borderColor: 'border-l-blue-400',
    bgColor: 'bg-blue-400/10',
    textColor: 'text-blue-400',
    label: 'BAJA',
  },
  info: {
    icon: CheckCircle,
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
    label: 'INFO',
  },
};

export default function AlertCard({
  alert,
  onAcknowledge,
  compact = false,
  className = '',
}: AlertCardProps) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div
        className={`
          flex items-start gap-4 p-4 rounded-xl border-l-4 border-r border-y border-white/5 glass-dark
          ${cfg.borderColor}
          ${alert.acknowledged ? 'opacity-50' : ''}
          ${className}
          transition-all duration-300 hover:bg-white/5
        `}
      >
        <div className={`p-2 rounded-lg ${cfg.bgColor}`}>
           <Icon size={20} className={`${cfg.textColor} shrink-0`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-white truncate">
            {alert.title}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-data">
            {alert.siloName} <span className="mx-2 text-zinc-700">·</span> {formatRelativeTime(alert.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative rounded-2xl border-r border-y border-white/5 glass-dark overflow-hidden
        border-l-[6px] ${cfg.borderColor}
        transition-all duration-300 hover:bg-white/5 hover:-translate-y-1
        ${alert.acknowledged ? 'opacity-50' : ''}
        ${alert.severity === 'critical' ? 'shadow-[0_0_30px_rgba(239,68,68,0.15)] border-y-red-500/20 border-r-red-500/20 animate-pulse' : ''}
        ${className}
      `}
    >
      {alert.severity === 'critical' && (
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
      )}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${cfg.bgColor} shrink-0`}>
            <Icon size={24} className={cfg.textColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[10px] tracking-widest font-bold uppercase ${cfg.textColor}`}>
                {cfg.label}
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs text-zinc-400 font-data">
                {alert.siloName}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {alert.title}
            </h3>
            <p className="text-sm text-zinc-400 mt-2 font-light leading-relaxed">
              {alert.description}
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-data shrink-0 bg-white/5 px-3 py-1 rounded-full">
            {formatRelativeTime(alert.timestamp)}
          </span>
        </div>

        {/* Recommendation */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300 font-light">
          <span className="font-bold text-white mr-2">ACCIÓN RECOMENDADA:</span>
          {alert.recommendation}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <Link
            href={`/dashboard/silo/${alert.siloId}`}
            className="
              inline-flex items-center gap-2 px-6 py-2.5 rounded-lg
              text-sm font-bold text-black
              bg-emerald-500 hover:bg-emerald-400
              transition-colors duration-300 cursor-pointer uppercase tracking-wider
            "
          >
            Ver Detalle
            <ArrowRight size={16} />
          </Link>
          {!alert.acknowledged && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="
                inline-flex items-center gap-2 px-6 py-2.5 rounded-lg
                text-sm font-bold text-zinc-400
                border border-white/10
                hover:bg-white/10 hover:text-white transition-colors duration-300
                cursor-pointer uppercase tracking-wider
              "
            >
              <Eye size={16} />
              Marcar Vista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
