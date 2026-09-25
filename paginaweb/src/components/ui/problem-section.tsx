"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";

export function ProblemSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <section className="py-10 relative flex flex-col items-center justify-center bg-zinc-950/50 border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <WebGLShader />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="text-center mb-20 z-10 max-w-3xl px-4">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-rose-500 font-bold tracking-widest uppercase text-sm mb-4 block"
        >
          El Problema Oculto
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
        >
          Las pérdidas por almacenamiento silencioso cuestan millones.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 text-lg md:text-xl"
        >
          La mayoría de los problemas de deterioro, humedad excesiva y temperatura dentro de la silobolsa no son visibles desde el exterior hasta que es demasiado tarde.
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-6 relative z-10"
      >
        <ProblemCard 
          icon={<AlertTriangle className="w-8 h-8 text-rose-500" />}
          title="Millones Perdidos"
          description="Miles de toneladas sufren deterioro cada año debido a la falta de monitoreo interno y fallas en la integridad de la bolsa."
          metric="20%"
          metricLabel="Pérdida anual promedio en acopios sin monitoreo"
        />
        <ProblemCard 
          icon={<TrendingDown className="w-8 h-8 text-amber-500" />}
          title="Rentabilidad Afectada"
          description="Las pérdidas por almacenamiento pueden superar fácilmente los miles de dólares por cada silobolsa comprometida."
          metric="-$5,000"
          metricLabel="Pérdida potencial por silobolsa dañada"
        />
        <ProblemCard 
          icon={<Clock className="w-8 h-8 text-orange-500" />}
          title="Detección Tardía"
          description="Los métodos tradicionales de pinchado y calado son lentos, dañan el plástico y no ofrecen datos en tiempo real."
          metric="+72hs"
          metricLabel="Retraso promedio en detectar focos de calor"
        />
      </motion.div>
    </section>
  );
}

function ProblemCard({ icon, title, description, metric, metricLabel }: { icon: React.ReactNode, title: string, description: string, metric: string, metricLabel: string }) {
  return (
    <motion.div 
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(225,29,72,0.05)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="mb-6 inline-flex p-3 rounded-2xl bg-black border border-white/5 group-hover:scale-110 group-hover:border-rose-500/30 transition-all duration-300 relative z-10">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3 relative z-10 group-hover:text-rose-400 transition-colors">{title}</h3>
      <p className="text-zinc-400 leading-relaxed mb-8 flex-1 relative z-10">{description}</p>
      
      <div className="pt-6 border-t border-white/5 relative z-10 group-hover:border-white/10 transition-colors">
        <div className="text-4xl font-black text-white tracking-tighter mb-2 group-hover:text-rose-500 transition-colors">{metric}</div>
        <div className="text-sm font-medium text-zinc-500 uppercase tracking-wide">{metricLabel}</div>
      </div>
    </motion.div>
  );
}
