'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Cpu, Wifi, BrainCircuit, LayoutDashboard } from 'lucide-react';

export function DataFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const nodes = [
    { icon: Cpu, title: "Sensor IoT", desc: "Captura humedad, CO2 y temperatura" },
    { icon: Wifi, title: "LoRaWAN", desc: "Transmisión a 15km de distancia" },
    { icon: BrainCircuit, title: "IA Predictiva", desc: "Análisis de riesgo y detección temprana" },
    { icon: LayoutDashboard, title: "Dashboard", desc: "Visualización en tiempo real" },
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-10 px-4 md:px-12 flex flex-col items-center">
      
      <div className="text-center mb-32 relative z-10">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-xl">
          CÓMO FUNCIONA
        </h2>
        <p className="text-emerald-500 font-bold tracking-widest uppercase mt-4 text-xl">
          De la silobolsa a tu celular
        </p>
      </div>
      
      {/* Animated glowing SVG Line connecting nodes */}
      <div className="absolute left-[55px] md:left-1/2 top-64 bottom-10 w-1 -ml-0.5 z-0">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 4 1000">
          <line x1="2" y1="0" x2="2" y2="1000" stroke="#ffffff10" strokeWidth="4" />
          <motion.line 
            x1="2" y1="0" x2="2" y2="1000" 
            stroke="#10b981" 
            strokeWidth="4" 
            style={{ pathLength }}
            className="drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-32 md:gap-40 w-full relative z-10">
        {nodes.map((node, i) => {
          const isEven = i % 2 === 0;
          return (
            <div key={i} className={`relative flex items-center gap-8 md:gap-16 ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
              
              {/* Empty space for alternating layout on desktop */}
              <div className="hidden md:block flex-1" />

              {/* Node Icon */}
              <motion.div 
                className="relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-3xl glass-dark border border-white/10 flex items-center justify-center bg-black shrink-0 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: false, margin: "-10%" }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 animate-pulse" />
                <node.icon className="w-12 h-12 md:w-16 md:h-16 text-emerald-400" />
              </motion.div>

              {/* Node Content */}
              <motion.div 
                className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'} pl-6 md:pl-0`}
                initial={{ x: isEven ? -50 : 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: false, margin: "-10%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-md">
                  {node.title}
                </h3>
                <p className="text-zinc-400 text-xl md:text-2xl leading-relaxed">
                  {node.desc}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
