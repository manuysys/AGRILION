"use client";

import { motion } from "framer-motion";
import { ArrowDown, AlertCircle, CheckCircle2, ThermometerSun, Droplets, Wind, BrainCircuit } from "lucide-react";

export function AiSection() {
  return (
    <section className="py-10 relative bg-[#020617] flex flex-col items-center overflow-hidden border-t border-white/5">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center mb-20 relative z-10 max-w-3xl px-4">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
          La IA analiza los datos por vos
        </h2>
        <p className="text-zinc-400 text-lg md:text-xl">
          Agrilion+ detecta patrones microscópicos que escapan al ojo humano. Nuestro motor de IA procesa millones de datos diarios para prevenir el deterioro antes de que se expanda.
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4">
        
        {/* INPUTS */}
        <div className="flex gap-4 md:gap-8 justify-center w-full mb-8">
          <InputBox icon={<ThermometerSun className="w-6 h-6 text-rose-400" />} label="Temperatura" value="↑ 28°C" color="border-rose-500/30 bg-rose-500/10 text-rose-400" />
          <InputBox icon={<Droplets className="w-6 h-6 text-blue-400" />} label="Humedad" value="↑ 19%" color="border-blue-500/30 bg-blue-500/10 text-blue-400" />
          <InputBox icon={<Wind className="w-6 h-6 text-amber-400" />} label="Gas CO₂" value="↑ 850ppm" color="border-amber-500/30 bg-amber-500/10 text-amber-400" />
        </div>

        {/* FLOW ARROWS */}
        <div className="flex gap-4 md:gap-8 justify-center w-full mb-8">
          <FlowArrow delay={0.2} />
          <FlowArrow delay={0.3} />
          <FlowArrow delay={0.4} />
        </div>

        {/* AI ENGINE */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="relative w-64 h-32 md:w-96 md:h-40 bg-black border border-emerald-500/50 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] group"
        >
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/5 animate-pulse" />
          <div className="flex flex-col items-center gap-3">
            <BrainCircuit className="w-12 h-12 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
            <span className="text-xl font-bold text-white tracking-widest">MOTOR DE IA</span>
          </div>
          
          {/* Particles going into the engine */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-full flex justify-center">
             <div className="w-px h-16 bg-gradient-to-b from-transparent to-emerald-500" />
          </div>
        </motion.div>

        {/* OUT ARROW */}
        <div className="flex justify-center w-full mb-8">
          <FlowArrow delay={0.6} />
        </div>

        {/* OUTPUT RESULT */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="flex-1 bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-rose-500" />
              <span className="font-bold text-rose-400">Riesgo Alto Detectado</span>
            </div>
            <p className="text-sm text-zinc-400">Probabilidad de fermentación: 94%</p>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1 }}
            className="flex-1 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <span className="font-bold text-emerald-400">Acción Recomendada</span>
            </div>
            <p className="text-sm text-zinc-400">Inspeccionar silobolsa (Sector B) en las próximas 12 horas.</p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function InputBox({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      className={`flex-1 border rounded-2xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-sm ${color}`}
    >
      <div className="mb-2">{icon}</div>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">{label}</div>
      <div className="text-xl md:text-2xl font-black">{value}</div>
    </motion.div>
  );
}

function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
      className="flex-1 flex justify-center text-zinc-600"
    >
      <ArrowDown className="w-6 h-6" />
    </motion.div>
  );
}
