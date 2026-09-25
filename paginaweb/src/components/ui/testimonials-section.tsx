"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Implementamos Agrilion en 40 silobolsas y detectamos un foco de temperatura a las 48hs de guardado. Salvamos más de $50,000 en pérdidas. El sistema se pagó solo el primer mes.",
    name: "Martín E.",
    role: "Director de Operaciones",
    company: "Cereales del Sur",
    image: "https://i.pravatar.cc/150?img=11"
  },
  {
    quote: "La tranquilidad de abrir la app y ver que todo está verde no tiene precio. Antes dependíamos de calados semanales que rompían el plástico. Ahora es 100% digital y en tiempo real.",
    name: "Roberto V.",
    role: "Productor Agropecuario",
    company: "Estancia La Paz",
    image: "https://i.pravatar.cc/150?img=33"
  },
  {
    quote: "La integración con nuestro sistema de gestión fue inmediata. La precisión de los sensores y la predicción de IA nos permitió planificar la extracción logística con margen de seguridad.",
    name: "Carolina S.",
    role: "Gerente de Planta",
    company: "AgroTech Group",
    image: "https://i.pravatar.cc/150?img=44"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-10 relative bg-black flex flex-col items-center overflow-hidden border-t border-white/5">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />

      <div className="text-center mb-20 relative z-10 max-w-3xl px-4">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Confiado por los líderes del agro
        </h2>
        <p className="text-zinc-400 text-lg">
          No escuches solo lo que decimos nosotros. Escuchá los resultados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl px-6 relative z-10">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col relative group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] transition-all duration-300"
          >
            {/* Glossy top highlight */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <Quote className="w-10 h-10 text-emerald-500/40 absolute top-6 right-6 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-300" />
            
            <p className="text-zinc-300 text-lg leading-relaxed mb-8 relative z-10 flex-1 pr-12">
              &ldquo;{t.quote}&rdquo;
            </p>
            
            <div className="flex items-center gap-4 border-t border-white/10 pt-6 relative z-10">
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-r from-emerald-500 to-blue-500 group-hover:animate-spin-slow">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  <Image src={t.image} alt={t.name} width={56} height={56} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
              </div>
              <div>
                <div className="font-bold text-white text-lg">{t.name}</div>
                <div className="text-sm text-emerald-400/80">{t.role} en <span className="text-zinc-400">{t.company}</span></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
