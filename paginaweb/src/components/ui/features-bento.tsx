/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useRef } from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Activity, ShieldAlert, Cpu, Wifi, Cloud } from "lucide-react";
import { motion, useInView } from "framer-motion";
import AuroraBorealisShader from "@/components/ui/aurora-borealis-shader";

const items = [
  {
    title: "Sensores IoT Modulares",
    description: "Lanzas de precisión que miden temperatura, humedad y CO₂ en tiempo real. Construidas para soportar las condiciones más extremas del campo.",
    icon: <Activity className="h-6 w-6 text-emerald-400 group-hover/bento:text-emerald-300 transition-colors" />,
    className: "md:col-span-2",
  },
  {
    title: "Conectividad LoRaWAN",
    description: "Transmisión de ultra bajo consumo con alcance de hasta 15km, garantizando más de 2 años de autonomía.",
    icon: <Wifi className="h-6 w-6 text-emerald-400 group-hover/bento:text-emerald-300 transition-colors" />,
    className: "md:col-span-1",
  },
  {
    title: "Machine Learning Predictivo",
    description: "Algoritmos que analizan patrones históricos para detectar fermentación y anomalías antes de que el daño sea irreversible.",
    icon: <ShieldAlert className="h-6 w-6 text-emerald-400 group-hover/bento:text-emerald-300 transition-colors" />,
    className: "md:col-span-1",
  },
  {
    title: "Gateway Central Agrilion",
    description: "El cerebro de la operación. Procesa y unifica los datos de cientos de silobolsas para subirlos de forma segura a la nube.",
    icon: <Cpu className="h-6 w-6 text-emerald-400 group-hover/bento:text-emerald-300 transition-colors" />,
    className: "md:col-span-1",
  },
  {
    title: "Infraestructura Cloud Segura",
    description: "Tus datos respaldados con arquitectura de alta disponibilidad. Acceso instantáneo a métricas e históricos desde cualquier dispositivo.",
    icon: <Cloud className="h-6 w-6 text-emerald-400 group-hover/bento:text-emerald-300 transition-colors" />,
    className: "md:col-span-1",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function FeaturesBento() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative w-full py-24 overflow-hidden bg-black">
      <div className="absolute inset-0 z-0 opacity-70">
        <AuroraBorealisShader className="w-full h-full" />
      </div>
      <div ref={containerRef} className="max-w-7xl mx-auto px-6 w-full relative z-20">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4">
            Tecnología que <br className="hidden md:block" />
            <span className="text-emerald-500">marca la diferencia</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Un ecosistema integral diseñado desde cero para proteger el valor de tu producción con datos precisos y accionables.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`group relative flex flex-col bg-zinc-900/30 backdrop-blur-md border border-white/10 rounded-3xl p-8 overflow-hidden hover:bg-zinc-900/50 transition-colors shadow-2xl ${item.className}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/20 blur-[60px] rounded-full group-hover:bg-emerald-500/40 transition-colors duration-700" />
              
              <div className="mb-6 inline-flex p-4 rounded-2xl bg-black border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform duration-500 relative z-10 w-fit">
                {item.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10 tracking-tight">{item.title}</h3>
              <p className="text-zinc-400 leading-relaxed relative z-10">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
