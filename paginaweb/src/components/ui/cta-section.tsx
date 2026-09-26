"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-32 relative bg-[#020617] flex flex-col items-center justify-center overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-emerald-500/20 blur-[150px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6"
      >
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-[3rem] p-12 md:p-20 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 relative z-10">
            Comenzá a monitorear tus silobolsas hoy.
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mb-12 relative z-10">
            Únete a cientos de productores que ya confían en la inteligencia artificial para proteger el valor de su cosecha. Instalación rápida y resultados desde el primer día.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <Link 
              href="/registro"
              className="bg-emerald-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 flex items-center justify-center gap-2"
            >
              Solicitar Demo Gratuita <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="mailto:eest4.74.agrilion@gmail.com"
              className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              Hablar con Ventas
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
