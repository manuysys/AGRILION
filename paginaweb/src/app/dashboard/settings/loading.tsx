'use client';

export default function SettingsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      <div>
        <div className="h-8 w-40 bg-white/10 rounded-lg mb-2 shimmer" />
        <div className="h-4 w-60 bg-white/5 rounded-full shimmer" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-white/10 bg-zinc-900/60 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
            <div className="h-5 w-32 bg-white/10 rounded-full mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-white/5 rounded-full" />
              <div className="h-4 w-3/4 bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
