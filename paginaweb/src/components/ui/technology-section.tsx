"use client";

import { motion } from "framer-motion";
import { Cpu, Wifi, Server, Cloud, BrainCircuit } from "lucide-react";

const technologies = [
  {
    icon: <Cpu className="w-8 h-8 text-emerald-400" />,
    title: "Sensores Inteligentes",
    description: "Lanzas IoT modulares de grado industrial que miden temperatura, humedad relativa y concentración de CO2 con precisión quirúrgica dentro de la silobolsa.",
  },
  {
    icon: <Wifi className="w-8 h-8 text-emerald-400" />,
    title: "Conectividad LoRaWAN",
    description: "Transmisión de largo alcance (hasta 15km) y ultra bajo consumo de batería. Tus sensores funcionarán por años sin necesidad de mantenimiento.",
  },
  {
    icon: <Server className="w-8 h-8 text-emerald-400" />,
    title: "Gateway Agrilion",
    description: "El cerebro central del campo. Recibe los datos de cientos de silobolsas y los sube a la nube de forma segura y encriptada, incluso con conexión a internet intermitente.",
  },
  {
    icon: <Cloud className="w-8 h-8 text-emerald-400" />,
    title: "Cloud Platform",
    description: "Infraestructura robusta y escalable (SaaS) que almacena millones de puntos de datos históricos, asegurando disponibilidad del 99.9% desde cualquier dispositivo.",
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-emerald-400" />,
    title: "IA Predictiva",
    description: "Modelos de Machine Learning entrenados con miles de ciclos de almacenamiento para predecir brotes de temperatura, hongos y zonas de riesgo antes de que ocurran.",
  }
];

export function TechnologySection() {
  return (
    <section className="py-10 relative bg-black flex flex-col items-center overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="text-center mb-24 relative z-10 max-w-3xl px-4">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Stack Tecnológico Completo
        </h2>
        <p className="text-zinc-400 text-lg md:text-xl">
          Hardware robusto combinado con software inteligente. Una solución End-to-End diseñada específicamente para el entorno rural.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-6 relative z-10">
        {technologies.map((tech, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`group relative flex flex-col bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-3xl p-8 overflow-hidden hover:bg-zinc-900/50 transition-colors ${
              i === 3 || i === 4 ? "lg:col-span-1" : ""
            } ${i === 4 ? "lg:col-start-2 lg:col-end-3" : ""}`} // Centering the last row if needed, or just let them wrap natively.
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/30 transition-colors" />
            
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-black border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform duration-500">
              {tech.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{tech.title}</h3>
            <p className="text-zinc-400 leading-relaxed relative z-10">{tech.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
