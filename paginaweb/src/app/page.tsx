'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ChevronDown, ArrowRight, ShieldCheck, Activity, Cpu, AlertTriangle, Droplet, Wind } from 'lucide-react';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import Link from 'next/link';
import Image from 'next/image';

import { FeaturesBento } from '@/components/ui/features-bento';
import { Scene3D } from '@/components/ui/scene-3d';
import { RiveLogo } from '@/components/ui/rive-logo';
import { DataFlow } from '@/components/ui/data-flow';
import { HardwareShowcase } from '@/components/ui/hardware-showcase';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Hero parallax effects
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -100]);

  // Smooth background color crossfade
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    ['rgba(0,0,0,1)', 'rgba(9,9,11,1)', 'rgba(0,0,0,1)', 'rgba(9,9,11,1)']
  );

  return (
    <motion.div ref={containerRef} style={{ backgroundColor }} className="text-white min-h-[500vh] selection:bg-emerald-500/30 transition-colors duration-1000">
      
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
              { title: "Problema", icon: AlertTriangle },
              { title: "Flujo", icon: Cpu },
              { title: "Dashboard", icon: ShieldCheck }
            ]}
            onChange={(index) => {
              if (index === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
              if (index === 1) document.getElementById('problema')?.scrollIntoView({ behavior: 'smooth' });
              if (index === 2) document.getElementById('flujo')?.scrollIntoView({ behavior: 'smooth' });
              if (index === 3) document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <Link href="/dashboard" className="hidden md:block px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-zinc-200 hover:scale-105 transition-all text-sm">
            ENTRAR
          </Link>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative h-[120vh] w-full flex items-center justify-center pointer-events-none z-10 overflow-hidden">
        {/* Subtle background image from real field */}
        <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 z-[-1] mix-blend-overlay">
          <Image 
            src="/images/hero-field.png" 
            alt="Campo y silobolsas" 
            fill 
            className="object-cover"
            priority
          />
          {/* Gradient fade to bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        </motion.div>

        <motion.div 
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative flex flex-col items-center justify-center text-center px-4 mt-[-10vh]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
      <section id="problema" className="relative min-h-[80vh] flex flex-col items-center justify-center pointer-events-auto z-10 py-32 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <p className="text-3xl md:text-5xl text-white/80 font-light leading-tight drop-shadow-lg mb-8">
              Cada año se pierden <span className="text-red-500 font-bold">miles de toneladas</span> de granos por falta de visibilidad.
            </p>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              No podemos controlar el clima, pero con Agrilion podemos <span className="text-emerald-500 font-bold">predecir el riesgo</span> antes de que ocurran las pérdidas económicas mediante alertas tempranas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Droplet, color: "text-blue-500", title: "Humedad Alta", desc: "Posible filtración o rotura de la silobolsa." },
              { icon: Activity, color: "text-red-500", title: "Temperatura Elevada", desc: "Actividad microbiana y calentamiento del grano." },
              { icon: Wind, color: "text-amber-500", title: "CO₂ Alto", desc: "Deterioro acelerado e infestación inminente." },
            ].map((risk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ 
                  delay: i * 0.2, 
                  duration: 0.8,
                  y: { repeat: Infinity, duration: 4 + i, ease: "easeInOut" }
                }}
                className="glass-dark p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center transform perspective-1000 shadow-xl"
              >
                <risk.icon className={`w-12 h-12 ${risk.color} mb-4 drop-shadow-[0_0_15px_currentColor]`} />
                <h3 className="text-xl font-bold mb-2">{risk.title}</h3>
                <p className="text-zinc-400 text-sm">{risk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: SHOWSTOPPER (Empty space to let the 3D scroll animation shine) */}
      <section className="relative h-[120vh] pointer-events-none z-10 flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-full text-center mix-blend-difference"
        >
          <h2 className="text-[12vw] font-bold tracking-tighter leading-none text-white/20 uppercase drop-shadow-md">
            Visibilidad Total
          </h2>
        </motion.div>
      </section>

      {/* SECTION 4: DATA FLOW (How it Works) */}
      <section id="flujo" className="relative border-t border-white/5 pt-32 z-20">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[4rem] md:text-[6rem] font-bold tracking-tighter leading-none"
          >
            CÓMO <span className="text-emerald-500">FUNCIONA</span>
          </motion.h2>
        </div>
        <DataFlow />
      </section>

      {/* SECTION 5: HARDWARE SHOWCASE */}
      <HardwareShowcase />

      {/* SECTION 6: FEATURES BENTO */}
      <section id="features" className="relative py-12 z-20">
        <FeaturesBento />
      </section>

      {/* SECTION 7: DASHBOARD */}
      <section id="dashboard" className="relative min-h-screen flex items-center justify-center py-32 z-20 border-t border-white/5 overflow-hidden">
        {/* Background glow for the dashboard section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-emerald-900/10 blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center gap-16 relative z-10">
          
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <h2 className="text-[3rem] md:text-[6rem] font-bold tracking-tighter leading-none mb-6">
              CONTROL<br/>ABSOLUTO.
            </h2>
            <p className="text-xl md:text-3xl text-zinc-400 font-light leading-snug">
              Una interfaz diseñada para la claridad. Alertas críticas antes de que ocurran pérdidas.
            </p>
            <div className="mt-12 pointer-events-auto">
              <Link href="/dashboard">
                <LiquidButton className="text-xl px-8 py-4 bg-white text-black hover:bg-emerald-400 hover:text-black hover:scale-105 transition-all">
                  Explorar Dashboard <ArrowRight className="ml-2 w-6 h-6 inline" />
                </LiquidButton>
              </Link>
            </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, rotateY: 30, scale: 0.8 }}
             whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
             viewport={{ once: true, margin: "-20%" }}
             whileHover={{ rotateY: 5, rotateX: 5, scale: 1.02 }}
             animate={{ y: [0, -15, 0] }}
             transition={{ 
               duration: 1.2, ease: [0.16, 1, 0.3, 1],
               y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
             }}
             className="flex-1 w-full"
          >
             <div className="relative glass-dark rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col gap-6 backdrop-blur-xl">
                {/* Mock Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="w-1/3 h-4 bg-white/10 rounded-full" />
                  <div className="w-12 h-4 bg-emerald-500/50 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                
                {/* Mock Cards - Fixed text overlapping by using md:text-5xl */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-28 md:h-32 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <span className="text-xs md:text-sm text-zinc-500 mb-1 z-10">Temperatura</span>
                     <span className="text-3xl md:text-5xl font-bold text-emerald-400 drop-shadow-md group-hover:scale-110 transition-transform z-10">18°</span>
                  </div>
                  <div className="h-28 md:h-32 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <span className="text-xs md:text-sm text-zinc-500 mb-1 z-10">Humedad</span>
                     <span className="text-3xl md:text-5xl font-bold text-emerald-400 drop-shadow-md group-hover:scale-110 transition-transform z-10">14%</span>
                  </div>
                </div>

                {/* Mock Chart */}
                <div className="h-40 md:h-48 bg-black/40 rounded-2xl border border-white/5 w-full flex items-end p-4 gap-2 relative overflow-hidden">
                   {/* Gradient overlay for chart */}
                   <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
                   {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                     <motion.div 
                       key={i} 
                       initial={{ height: 0 }}
                       whileInView={{ height: `${h}%` }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1, duration: 0.8, type: "spring" }}
                       className="flex-1 bg-emerald-500/40 rounded-t-sm hover:bg-emerald-400/80 transition-colors relative z-10" 
                     />
                   ))}
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 8: FOOTER CTA */}
      <footer className="relative py-32 flex flex-col items-center justify-center text-center px-4 z-20 pointer-events-auto border-t border-white/5">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <Image 
            src="/images/hero-field.png" 
            alt="Fondo footer" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           animate={{ y: [0, -5, 0] }}
           transition={{ duration: 1, y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
           className="relative z-10 max-w-4xl"
        >
          <h2 className="text-[3rem] md:text-[5rem] font-bold tracking-tighter mb-8 leading-tight">
            Protegé tu cosecha antes de que aparezcan las pérdidas.
          </h2>
          <LiquidButton className="text-2xl px-12 py-6 bg-emerald-500 text-black font-bold hover:scale-110 transition-transform drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            Solicitar Demo
          </LiquidButton>
        </motion.div>
      </footer>

    </motion.div>
  );
}
