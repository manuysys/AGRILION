'use client';

import { motion } from 'framer-motion';

export default function SiloDetailLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      {/* Hero skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 lg:p-12 glass-dark border border-white/10"
      >
        <div className="absolute inset-0 shimmer" />
        <div className="relative z-10 space-y-6">
          <div className="h-4 w-32 bg-white/10 rounded-full" />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="h-10 w-64 bg-white/10 rounded-lg" />
              <div className="flex gap-4">
                <div className="h-4 w-20 bg-white/5 rounded-full" />
                <div className="h-4 w-32 bg-white/5 rounded-full" />
                <div className="h-4 w-24 bg-white/5 rounded-full" />
              </div>
            </div>
            <div className="w-32 h-32 rounded-full bg-white/5" />
          </div>
        </div>
      </motion.div>

      {/* AI Interpretation skeleton */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 relative overflow-hidden">
        <div className="absolute inset-0 shimmer" />
        <div className="relative z-10 space-y-3">
          <div className="h-5 w-40 bg-white/10 rounded-full" />
          <div className="h-6 w-full bg-white/10 rounded-lg" />
          <div className="h-10 w-full bg-white/5 rounded-lg" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
            <div className="relative z-10 space-y-3">
              <div className="h-4 w-24 bg-white/10 rounded-full" />
              <div className="h-10 w-32 bg-white/10 rounded-lg" />
              <div className="h-12 w-full bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
