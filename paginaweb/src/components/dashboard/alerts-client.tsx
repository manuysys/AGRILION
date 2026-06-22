'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import type { Alert, AlertSeverity } from '@/types';
import AlertCard from '@/components/ui/alert-card';

interface AlertsClientProps {
  alerts: Alert[];
}

const filterOptions: { value: AlertSeverity | 'all' | 'resolved'; label: string; color: string }[] = [
  { value: 'all', label: 'Todas', color: 'bg-gray-100 text-gray-700' },
  { value: 'critical', label: 'Críticas', color: 'bg-red-50 text-red-700' },
  { value: 'high', label: 'Altas', color: 'bg-red-50 text-red-600' },
  { value: 'medium', label: 'Atención', color: 'bg-amber-50 text-amber-700' },
  { value: 'low', label: 'Bajas', color: 'bg-gray-50 text-gray-600' },
  { value: 'resolved', label: 'Resueltas', color: 'bg-emerald-50 text-emerald-700' },
];

export default function AlertsClient({ alerts: initialAlerts }: AlertsClientProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState(initialAlerts);

  const filteredAlerts = alerts.filter((alert) => {
    // Filter by severity
    if (filter === 'resolved') {
      if (!alert.acknowledged) return false;
    } else if (filter !== 'all') {
      if (alert.severity !== filter) return false;
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.siloName.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.siloId.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const activeCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">
          Alertas
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {activeCount} alerta{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}
          {criticalCount > 0 && (
            <span className="text-[var(--state-critical)] font-medium">
              {' '}· {criticalCount} crítica{criticalCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 flex-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-150 cursor-pointer
                ${filter === opt.value
                  ? `${opt.color} ring-2 ring-offset-1 ring-current/20`
                  : 'bg-white text-[var(--text-muted)] border border-[var(--border-default)] hover:bg-[var(--surface-1)]'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar alertas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg
              border border-[var(--border-default)] bg-white
              text-sm text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
              focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-accent)]/10
              transition-colors duration-150
              outline-none
            "
          />
        </div>
      </div>

      {/* Alert list */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 rounded-xl bg-white border border-[var(--border-default)] text-center">
          <Filter size={32} className="text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            No se encontraron alertas
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Probá con otros filtros o términos de búsqueda
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  );
}
