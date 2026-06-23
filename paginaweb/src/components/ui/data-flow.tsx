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
    <div ref={containerRef} className="relative max-w-4xl mx-auto py-32 px-4">
      
      {/* Animated glowing SVG Line connecting nodes */}
      <div className="absolute left-[39px] md:left-1/2 top-32 bottom-32 w-1 -ml-0.5">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 4 1000">
          <line x1="2" y1="0" x2="2" y2="1000" stroke="#ffffff10" strokeWidth="4" />
          <motion.line 
            x1="2" y1="0" x2="2" y2="1000" 
            stroke="#10b981" 
            strokeWidth="4" 
            style={{ pathLength }}
            className="drop-shadow-[0_0_15px_rgba(16,185,129,1)]"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-32">
        {nodes.map((node, i) => {
          const isEven = i % 2 === 0;
          return (
            <div key={i} className={`relative flex items-center gap-8 md:gap-16 ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
              
              {/* Empty space for alternating layout on desktop */}
              <div className="hidden md:block flex-1" />

              {/* Node Icon */}
              <motion.div 
                className="relative z-10 w-20 h-20 rounded-2xl glass-dark border border-emerald-500/30 flex items-center justify-center bg-black shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-10%" }}
                whileHover={{ scale: 1.1, rotateZ: 5 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ 
                  duration: 0.5, delay: 0.2,
                  y: { repeat: Infinity, duration: 3 + i * 0.5, ease: "easeInOut" }
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping opacity-20" />
                <node.icon className="w-8 h-8 text-emerald-400 relative z-10" />
              </motion.div>

              {/* Node Content */}
              <motion.div 
                className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'} glass-dark p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-colors`}
                initial={{ x: isEven ? -50 : 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-10%" }}
                whileHover={{ scale: 1.02 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ 
                  duration: 0.8, delay: 0.3,
                  y: { repeat: Infinity, duration: 4 + i * 0.2, ease: "easeInOut" }
                }}
              >
                <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 text-white drop-shadow-md">
                  {node.title}
                </h3>
                <p className="text-zinc-400 text-lg">
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
