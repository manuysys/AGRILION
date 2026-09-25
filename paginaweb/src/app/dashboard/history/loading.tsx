'use client';

import { motion } from 'framer-motion';

export default function HistoryLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      <div>
        <div className="h-8 w-32 bg-white/10 rounded-lg mb-2 shimmer" />
        <div className="h-4 w-48 bg-white/5 rounded-full shimmer" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-48 bg-white/5 rounded-xl shimmer" />
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          <div className="h-8 w-24 bg-white/10 rounded-lg" />
          <div className="h-8 w-20 bg-white/5 rounded-lg" />
          <div className="h-8 w-16 bg-white/5 rounded-lg" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-80 rounded-2xl border border-white/10 bg-zinc-900/60 relative overflow-hidden"
      >
        <div className="absolute inset-0 shimmer" />
      </motion.div>
    </div>
  );
}
