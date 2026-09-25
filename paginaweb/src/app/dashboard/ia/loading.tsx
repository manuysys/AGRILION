'use client';

export default function IALoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      <div>
        <div className="h-8 w-64 bg-white/10 rounded-lg mb-2 shimmer" />
        <div className="h-4 w-80 bg-white/5 rounded-full shimmer" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="h-48 rounded-2xl border border-white/10 bg-zinc-900/60 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="h-40 rounded-2xl border border-white/10 bg-zinc-900/60 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>
        <div className="h-[600px] rounded-2xl border border-white/10 bg-zinc-900/60 relative overflow-hidden">
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>
    </div>
  );
}
