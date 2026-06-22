'use client';

import { useState } from 'react';
import type { SiloBag } from '@/types';
import SiloCard from '@/components/ui/silo-card';
import { ListOrdered, ShieldAlert, CheckCircle2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RiskRankingProps {
  silos: SiloBag[];
}

type FilterType = 'all' | 'attention' | 'stable';

export default function RiskRanking({ silos }: RiskRankingProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter logic
  const filteredSilos = silos.filter((silo) => {
    if (filter === 'attention') {
      return silo.state === 'critical' || silo.state === 'warn' || silo.state === 'offline';
    }
    if (filter === 'stable') {
      return silo.state === 'ok';
    }
    return true;
  });

  const counts = {
    all: silos.length,
    attention: silos.filter((s) => s.state === 'critical' || s.state === 'warn' || s.state === 'offline').length,
    stable: silos.filter((s) => s.state === 'ok').length,
  };

  return (
    <section className="space-y-8 mt-12">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-none">
            MONITOREO
          </h2>
          <p className="text-sm md:text-base text-zinc-500 font-light mt-2">
            Estado detallado de cada silobolsa
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-2 p-2 rounded-2xl glass-dark border border-white/5 shadow-2xl">
          {[
            { id: 'all', label: 'TODOS', icon: Layers, count: counts.all, color: 'text-zinc-500' },
            { id: 'attention', label: 'ATENCIÓN', icon: ShieldAlert, count: counts.attention, color: 'text-red-500' },
            { id: 'stable', label: 'ESTABLES', icon: CheckCircle2, count: counts.stable, color: 'text-emerald-500' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as FilterType)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-widest transition-all duration-300 cursor-pointer select-none
                  ${isActive
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
                `}
              >
                <Icon size={14} className={isActive ? 'text-white' : tab.color} />
                <span>{tab.label}</span>
                <span className={`
                  text-[10px] ml-1 px-2 py-0.5 rounded-full
                  ${isActive ? 'bg-white/20' : 'bg-black/50'}
                `}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Silobags list with animations */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredSilos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-full p-12 rounded-3xl glass-dark border border-white/5 text-center text-zinc-500 text-xl font-light"
            >
              Ninguna silobolsa en este estado.
            </motion.div>
          ) : (
            filteredSilos.map((silo, index) => (
              <motion.div
                key={silo.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <SiloCard
                  silo={silo}
                  rank={filter === 'all' ? index + 1 : undefined}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
