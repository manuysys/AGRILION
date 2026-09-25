"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "Reducción de pérdidas hasta un 90%",
    desc: "Evita que el deterioro silencioso arruine toneladas de granos."
  },
  {
    title: "Monitoreo 100% remoto 24/7",
    desc: "Datos actualizados minuto a minuto sin necesidad de visitar el campo."
  },
  {
    title: "Alertas preventivas instantáneas",
    desc: "Notificaciones por SMS y Email ante el menor cambio de temperatura."
  },
  {
    title: "Predicción impulsada por IA",
    desc: "Algoritmos que proyectan el riesgo a futuro basándose en historial."
  },
  {
    title: "Gestión centralizada multi-campo",
    desc: "Administra decenas de locaciones desde un único panel de control."
  },
  {
    title: "Retorno de inversión en 6 meses",
    desc: "El sistema se paga solo al prevenir la primera rotura o fermentación."
  }
];

export function BenefitsSection() {
  return (
    <section className="py-10 relative flex flex-col items-center justify-center bg-zinc-950/30">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
        
        {/* Sticky Left Column */}
        <div className="relative">
          <div className="sticky top-40 flex flex-col items-start">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Beneficios que impactan tu rentabilidad.
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-md">
              Pasá de un esquema reactivo a uno predictivo. Nuestra tecnología te permite dormir tranquilo sabiendo que tu cosecha está asegurada.
            </p>
          </div>
        </div>

        {/* Scrollable Right Column */}
        <div className="flex flex-col gap-6 pt-10 lg:pt-40 pb-20">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -100px 0px" }}
              transition={{ duration: 0.5 }}
              className="bg-zinc-900/40 backdrop-blur-sm border border-white/10 rounded-3xl p-8 flex items-start gap-6 hover:bg-zinc-900 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group"
            >
              <div className="mt-1 p-2 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
