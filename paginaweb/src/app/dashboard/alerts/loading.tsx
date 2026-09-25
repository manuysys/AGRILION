'use client';

import { motion } from 'framer-motion';

export default function AlertsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      <div>
        <div className="h-8 w-32 bg-white/10 rounded-lg mb-2 shimmer" />
        <div className="h-4 w-48 bg-white/5 rounded-full shimmer" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-white/5 rounded-xl shimmer" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 rounded-2xl glass-dark border border-white/10 flex items-start gap-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer" />
            <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-white/10 rounded-full" />
              <div className="h-3 w-full bg-white/5 rounded-full" />
              <div className="h-3 w-1/2 bg-white/5 rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
