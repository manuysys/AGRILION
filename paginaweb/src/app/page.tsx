'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ChevronDown, ArrowRight, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import Link from 'next/link';

import { FeaturesBento } from '@/components/ui/features-bento';
import { Scene3D } from '@/components/ui/scene-3d';
import { RiveLogo } from '@/components/ui/rive-logo';
import { DataFlow } from '@/components/ui/data-flow';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Hero parallax effects
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.1], [0, -100]);

  return (
    <div ref={containerRef} className="bg-black text-white min-h-[500vh] selection:bg-emerald-500/30">
      
      {/* GLOBAL BACKGROUND 3D SCENE */}
      <Scene3D />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 p-6 mix-blend-difference pointer-events-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiveLogo className="w-8 h-8 rounded-lg overflow-hidden" />
            <span className="font-bold text-2xl tracking-tighter">AGRILION<span className="text-emerald-500">+</span></span>
          </div>
          <ExpandableTabs 
            tabs={[
              { title: "Inicio", icon: Activity },
              { title: "Flujo", icon: Cpu },
              { title: "Dashboard", icon: ShieldCheck }
            ]}
            onChange={(index) => {
              if (index === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
              if (index === 1) document.getElementById('flujo')?.scrollIntoView({ behavior: 'smooth' });
              if (index === 2) document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <Link href="/dashboard" className="hidden md:block px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors text-sm">
            ENTRAR
          </Link>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative h-screen w-full flex items-center justify-center pointer-events-none z-10">
        <motion.div 
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative flex flex-col items-center justify-center text-center px-4 mt-[-10vh]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[5rem] md:text-[12rem] font-bold tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 drop-shadow-2xl">
              AGRILION
            </h1>
            <p className="mt-6 text-xl md:text-3xl font-light tracking-[0.2em] text-emerald-400">
              SABER ES PODER
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute -bottom-32 flex flex-col items-center"
          >
            <span className="text-xs tracking-widest uppercase text-white/50 mb-2 font-bold">DESCUBRIR</span>
            <ChevronDown className="w-6 h-6 text-emerald-500 animate-bounce drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2: THE PROBLEM (Storytelling) */}
      <section className="relative min-h-[80vh] flex items-center justify-center pointer-events-none z-10">
        <div className="max-w-4xl mx-auto px-6 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-20%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-3xl md:text-5xl text-white/80 font-light leading-tight drop-shadow-lg">
              Cada año se pierden <span className="text-red-500 font-bold">miles de toneladas</span> de granos por falta de visibilidad.<br/><br/>
              No podemos controlar el clima, pero podemos <span className="text-emerald-500 font-bold">predecir el riesgo.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: SHOWSTOPPER (Empty space to let the 3D scroll animation shine) */}
      <section className="relative h-[150vh] pointer-events-none z-10">
        <div className="sticky top-1/2 -translate-y-1/2 w-full text-center mix-blend-difference opacity-50">
          {/* Subtle background text behind the 3D model */}
          <h2 className="text-[10vw] font-bold tracking-tighter leading-none text-white/5 uppercase">
            Visibilidad Total
          </h2>
        </div>
      </section>

      {/* SECTION 4: DATA FLOW (How it Works) */}
      <section id="flujo" className="relative bg-black border-t border-white/5 pt-32 z-20">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-[4rem] md:text-[6rem] font-bold tracking-tighter leading-none"
          >
            CÓMO <span className="text-emerald-500">FUNCIONA</span>
          </motion.h2>
        </div>
        <DataFlow />
      </section>

      {/* SECTION 5: FEATURES BENTO */}
      <section id="features" className="relative bg-black py-12 z-20">
        <FeaturesBento />
      </section>

      {/* SECTION 6: DASHBOARD */}
      <section id="dashboard" className="relative min-h-screen flex items-center justify-center py-32 bg-zinc-950 z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center gap-16">
          
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-20%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <h2 className="text-[3rem] md:text-[6rem] font-bold tracking-tighter leading-none mb-6">
              CONTROL<br/>ABSOLUTO.
            </h2>
            <p className="text-xl md:text-3xl text-zinc-400 font-light leading-snug">
              Una interfaz diseñada para la claridad. Alertas críticas antes de que ocurran pérdidas.
            </p>
            <div className="mt-12">
              <Link href="/dashboard">
                <LiquidButton className="text-xl px-8 py-4 bg-white text-black hover:bg-emerald-400 hover:text-black">
                  Explorar Dashboard <ArrowRight className="ml-2 w-6 h-6 inline" />
                </LiquidButton>
              </Link>
            </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, rotateY: 30, scale: 0.8 }}
             whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
             viewport={{ once: false, margin: "-20%" }}
             transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
             className="flex-1 w-full"
          >
             <div className="relative z-10 glass-dark rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col gap-6 transform perspective-1000">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="w-1/3 h-4 bg-white/20 rounded-full" />
                  <div className="w-12 h-4 bg-emerald-500/50 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center">
                     <span className="text-5xl font-bold text-emerald-400 drop-shadow-md">18°</span>
                  </div>
                  <div className="h-32 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center">
                     <span className="text-5xl font-bold text-emerald-400 drop-shadow-md">14%</span>
                  </div>
                </div>
                <div className="h-48 bg-white/5 rounded-2xl border border-white/5 w-full mt-4 flex items-end p-4 gap-2">
                   {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                     <div key={i} className="flex-1 bg-emerald-500/30 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }} />
                   ))}
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 7: FOOTER CTA */}
      <footer className="relative py-32 bg-black flex flex-col items-center justify-center text-center px-4 z-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop')] opacity-10 mix-blend-overlay object-cover" />
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: false }}
           transition={{ duration: 1 }}
           className="relative z-10 max-w-4xl"
        >
          <h2 className="text-[3rem] md:text-[5rem] font-bold tracking-tighter mb-8 leading-tight">
            Protegé tu cosecha antes de que aparezcan las pérdidas.
          </h2>
          <LiquidButton className="text-2xl px-12 py-6 bg-emerald-500 text-black font-bold">
            Solicitar Demo
          </LiquidButton>
        </motion.div>
      </footer>

    </div>
  );
}
