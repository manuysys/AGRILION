'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CloudCog, Cpu, LayoutDashboard, Radio } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Cpu,
    title: 'Sensores en la silobolsa',
    description:
      'El nodo CubeCell mide temperatura, humedad, presión, impacto y CO₂ dentro de la bolsa.',
  },
  {
    number: '02',
    icon: Radio,
    title: 'LoRaWAN hasta la nube',
    description:
      'Los datos viajan por LoRa a TTN con bajo consumo, pensado para el campo y largas distancias.',
  },
  {
    number: '03',
    icon: CloudCog,
    title: 'Datos, reglas e IA',
    description:
      'InfluxDB guarda el histórico y la API calcula riesgo, tendencias y recomendaciones.',
  },
  {
    number: '04',
    icon: LayoutDashboard,
    title: 'Decisiones en tu pantalla',
    description:
      'La app y el dashboard muestran el estado de cada silo, alertas y la evolución de las variables.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative overflow-hidden border-y border-white/5 bg-zinc-950 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_55%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <span className="mb-4 block text-sm font-bold uppercase tracking-widest text-emerald-500">
            De la silobolsa al tablero
          </span>
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            Cómo funciona <span className="text-emerald-500">Agrilion</span>
          </h2>
          <p className="mt-4 text-lg font-light leading-relaxed text-zinc-400">
            Un flujo completo, desde el sensor hasta la decisión, sin planillas
            ni mediciones manuales.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative rounded-3xl border border-white/[0.07] bg-white/[0.035] p-6 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.055]"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-data text-xs font-bold tracking-[0.2em] text-zinc-600">
                    PASO {step.number}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                    <Icon size={21} className="text-emerald-400" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <ArrowRight
                    size={16}
                    className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-zinc-700 xl:block"
                    aria-hidden="true"
                  />
                )}
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Ver el dashboard
            <ArrowRight size={16} />
          </Link>
          <span className="text-xs text-zinc-600">
            Datos de demostración disponibles sin hardware conectado.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
