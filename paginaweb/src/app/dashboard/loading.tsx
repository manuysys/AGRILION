'use client';

import { motion } from 'framer-motion';
import { Warehouse, Radio, Bell, Zap } from 'lucide-react';

function SkeletonCard({ icon: Icon, delay = 0 }: { icon: React.ComponentType<{ className?: string; size?: number }>, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col justify-between p-6 rounded-3xl glass-dark border border-white/10 relative overflow-hidden"
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 shimmer" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="h-3 w-20 bg-white/10 rounded-full" />
        <Icon className="text-zinc-700" size={24} />
      </div>

      <div className="relative z-10 flex justify-between items-end">
        <div>
          <div className="h-10 w-24 bg-white/10 rounded-lg mb-2" />
          <div className="h-2 w-32 bg-white/5 rounded-full" />
        </div>
        <div className="h-7 w-16 bg-white/5 rounded hidden sm:block" />
      </div>
    </motion.div>
  );
}

function SkeletonHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl min-h-[300px] flex flex-col justify-end p-8 lg:p-12 glass-dark border border-white/10"
    >
      <div className="absolute inset-0 shimmer" />
      <div className="relative z-10 space-y-4">
        <div className="h-8 w-48 bg-white/10 rounded-full" />
        <div className="h-14 w-80 bg-white/10 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-white/5 rounded-full" />
      </div>
    </motion.div>
  );
}

function SkeletonList() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 relative overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-50" />
      <div className="relative z-10">
        <div className="h-5 w-40 bg-white/10 rounded-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
              <div className="w-10 h-10 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-48 bg-white/10 rounded-full" />
                <div className="h-2 w-32 bg-white/5 rounded-full" />
              </div>
              <div className="w-16 h-6 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  const statsIcons = [Warehouse, Radio, Bell, Zap];

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      {/* Hero skeleton */}
      <SkeletonHero />

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-8">
        {statsIcons.map((Icon, i) => (
          <SkeletonCard key={i} icon={Icon} delay={0.1 * (i + 1)} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SkeletonList />
        </div>
        <div>
          <SkeletonList />
        </div>
      </div>
    </div>
  );
}
