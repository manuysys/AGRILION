'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, FlaskConical, RefreshCw, WifiOff } from 'lucide-react';
import type { DashboardStats } from '@/types';
import { formatRelativeTime } from '@/lib/formatters';

interface DataStatusBannerProps {
  stats: DashboardStats;
  isDemo: boolean;
  apiOnline: boolean;
}

export default function DataStatusBanner({
  stats,
  isDemo,
  apiOnline,
}: DataStatusBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const offlineSensors = Math.max(0, stats.totalSensors - stats.activeSensors);
  const showOffline = !isDemo && stats.totalSensors > 0 && offlineSensors > 0;

  if (isDemo) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FlaskConical size={18} className="mt-0.5 shrink-0 text-sky-400" />
          <div>
            <p className="font-bold text-sky-200">Modo demostración</p>
            <p className="text-sky-200/70">
              Los silos, lecturas y ubicaciones son simulados para mostrar el producto sin hardware conectado.
            </p>
          </div>
        </div>
        <RefreshButton
          isPending={isPending}
          onClick={() => startTransition(() => router.refresh())}
        />
      </div>
    );
  }

  if (!apiOnline) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <WifiOff size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-bold text-red-200">Sin conexión con la API</p>
            <p className="text-red-200/70">
              No se pudieron cargar lecturas nuevas. Revisá el backend o el túnel antes de tomar decisiones.
            </p>
          </div>
        </div>
        <RefreshButton
          isPending={isPending}
          onClick={() => startTransition(() => router.refresh())}
        />
      </div>
    );
  }

  if (stats.totalSensors === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-amber-200">No hay silobolsas con lecturas</p>
            <p className="text-amber-200/70">
              Registrá un silo o verificá que el nodo esté enviando datos a la API.
            </p>
          </div>
        </div>
        <RefreshButton
          isPending={isPending}
          onClick={() => startTransition(() => router.refresh())}
        />
      </div>
    );
  }

  if (showOffline) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-amber-200">
              {offlineSensors} de {stats.totalSensors} sensores sin datos recientes
            </p>
            <p className="text-amber-200/70">
              Última lectura recibida {formatRelativeTime(stats.lastGlobalUpdate)}. El dashboard muestra el último estado conocido.
            </p>
          </div>
        </div>
        <RefreshButton
          isPending={isPending}
          onClick={() => startTransition(() => router.refresh())}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-1 text-xs text-zinc-600">
      <span>Actualizado {formatRelativeTime(stats.lastGlobalUpdate)}</span>
      <RefreshButton
        compact
        isPending={isPending}
        onClick={() => startTransition(() => router.refresh())}
      />
    </div>
  );
}

function RefreshButton({
  isPending,
  onClick,
  compact = false,
}: {
  isPending: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-wait disabled:opacity-50 ${
        compact ? 'h-7 w-7' : 'px-3 py-1.5 text-xs font-bold'
      }`}
      aria-label="Actualizar datos"
    >
      <RefreshCw size={compact ? 13 : 14} className={isPending ? 'animate-spin' : ''} />
      {!compact && (isPending ? 'Actualizando' : 'Actualizar')}
    </button>
  );
}
