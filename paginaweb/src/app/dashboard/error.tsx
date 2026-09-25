'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6"
        >
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Error al cargar el dashboard
        </h2>
        <p className="text-zinc-400 mb-8">
          No se pudieron cargar los datos de monitoreo. Esto puede deberse a un problema de conexión o del servidor.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold hover:bg-emerald-400 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white/5 text-white border border-white/10 px-6 py-3 rounded-full font-bold hover:bg-white/10 transition-all"
          >
            <Home className="w-4 h-4" />
            Inicio
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-left">
            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
