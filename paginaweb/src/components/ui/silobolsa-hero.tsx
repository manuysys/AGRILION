'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AnimatedShaderBackground } from '@/components/ui/animated-shader-hero';
import { RiveLogo } from '@/components/ui/rive-logo';

export function SilobolsaHero() {
  return (
    <section className="relative min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Background: Animated Shader (colorful waves) */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
        <AnimatedShaderBackground />
      </div>

      {/* Content overlay */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">

        {/* Rive Logo (Hexagon) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-0 relative w-40 h-40 md:w-64 md:h-64 flex justify-center items-center mx-auto"
        >
          <RiveLogo className="w-full h-full" />
        </motion.div>

        {/* Brand / Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-2 leading-[0.9] uppercase"
        >
          AGRILION
        </motion.h1>

        {/* Subtitle / Tagline */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="text-base md:text-2xl text-emerald-500 font-bold tracking-[0.2em] uppercase mt-4"
        >
          Saber es Poder
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
          className="mt-6 max-w-2xl text-sm md:text-lg text-zinc-300/90 font-light leading-relaxed"
        >
          Monitoreo IoT e inteligencia artificial para silobolsas: temperatura,
          humedad y CO₂ en tiempo real para detectar riesgos antes de que sea tarde.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-black text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Ver dashboard
            <ArrowRight size={17} />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Cómo funciona
          </a>
        </motion.div>

        <motion.a
          href="#dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mt-10 inline-flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-emerald-400"
          aria-label="Bajar al dashboard"
        >
          Explorar
          <ChevronDown size={16} />
        </motion.a>

      </div>
    </section>
  );
}
