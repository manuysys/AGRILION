'use client';

import { motion } from 'framer-motion';
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
          className="mb-0 relative w-56 h-56 md:w-72 md:h-72 flex justify-center items-center mx-auto"
        >
          <RiveLogo className="w-full h-full" />
        </motion.div>

        {/* Brand / Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-2 leading-[0.9] uppercase"
        >
          AGRILION
        </motion.h1>

        {/* Subtitle / Tagline */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="text-xl md:text-3xl text-emerald-500 font-bold tracking-[0.2em] uppercase mt-4"
        >
          Saber es Poder
        </motion.h2>

      </div>
    </section>
  );
}
