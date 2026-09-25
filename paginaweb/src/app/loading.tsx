import { RiveLogo } from '@/components/ui/rive-logo';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />

      {/* Animated pulse rings */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center">
          <RiveLogo className="w-20 h-20 animate-pulse drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
          <div className="mt-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="mt-4 text-sm text-zinc-500 font-medium tracking-widest uppercase">Cargando</p>
        </div>
      </div>
    </div>
  );
}
