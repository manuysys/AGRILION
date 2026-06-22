'use client';

import { useRouter } from 'next/navigation';
import { Package, ArrowRight, Shield, Eye } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface-dark)] via-[#0d2818] to-[#0a1a10] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>
      </div>
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[150px]" />
      <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[120px]" />

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="glass-dark rounded-2xl p-8 sm:p-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Package size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Agrilion<span className="text-emerald-400">+</span>
          </h1>
          <p className="text-sm text-white/50 mt-1 mb-8">
            Monitoreo Inteligente de Silobolsas
          </p>

          {/* Demo login */}
          <button
            onClick={handleLogin}
            className="
              w-full flex items-center justify-center gap-3
              px-6 py-4 rounded-xl
              text-base font-semibold text-white
              bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]
              transition-all duration-200 cursor-pointer
              shadow-lg shadow-emerald-900/30
              group
            "
          >
            <Shield size={20} />
            Ingresar como Demo
            <ArrowRight
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>

          <p className="text-xs text-white/30 mt-4">
            Acceso directo al dashboard con datos de demostración
          </p>

          {/* Features preview */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Eye, label: 'Monitoreo' },
                { icon: Shield, label: 'Alertas' },
                { icon: Package, label: '6 Silos' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="text-center">
                    <Icon size={18} className="text-white/30 mx-auto mb-1" />
                    <span className="text-[10px] text-white/40">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/20 text-center mt-6">
          © 2026 Agrilion — Juan Manuel Iglesias
        </p>
      </div>
    </div>
  );
}
