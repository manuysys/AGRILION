'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import type { Alert, AlertSeverity } from '@/types';
import AlertCard from '@/components/ui/alert-card';

interface AlertsClientProps {
  alerts: Alert[];
}

const filterOptions: { value: AlertSeverity | 'all' | 'resolved'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'critical', label: 'Críticas' },
  { value: 'high', label: 'Altas' },
  { value: 'medium', label: 'Atención' },
  { value: 'low', label: 'Bajas' },
  { value: 'resolved', label: 'Resueltas' },
];

const filterColors: Record<string, string> = {
  all: 'bg-white/10 text-white',
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-red-400/20 text-red-300',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-blue-400/20 text-blue-300',
  resolved: 'bg-emerald-500/20 text-emerald-400',
};

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Alertas
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {activeCount} alerta{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}
          {criticalCount > 0 && (
            <span className="text-red-500 font-medium">
              {' '}· {criticalCount} crítica{criticalCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter pills with animated indicator */}
        <div className="flex flex-wrap gap-2 flex-1 p-1.5 rounded-2xl glass-dark border border-white/5">
          {filterOptions.map((opt) => {
            const isActive = filter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`
                  relative px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase
                  transition-all duration-300 cursor-pointer select-none
                  ${isActive
                    ? filterColors[opt.value]
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-alert-filter"
                    className="absolute inset-0 rounded-xl bg-white/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            placeholder="Buscar alertas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl
              border border-white/10 bg-zinc-900/60 backdrop-blur-xl
              text-sm text-white
              placeholder:text-zinc-600
              focus:border-emerald-500/50
              transition-colors duration-150
              outline-none
            "
          />
        </div>
      </div>

      {/* Alert list */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-12 rounded-2xl glass-dark border border-white/10 text-center"
            >
              <Filter size={32} className="text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-white">
                No se encontraron alertas
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Probá con otros filtros o términos de búsqueda
              </p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <AlertCard
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
