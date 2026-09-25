"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

const plans = [
  {
    name: "Starter",
    description: "Ideal para pequeños productores que buscan iniciarse en el monitoreo digital.",
    price: "$99",
    billing: "por mes / silobolsa",
    popular: false,
    features: [
      { text: "Monitoreo de temperatura", included: true },
      { text: "Alertas vía Email", included: true },
      { text: "Historial de 30 días", included: true },
      { text: "Predicción IA básica", included: false },
      { text: "Monitoreo de CO2", included: false },
      { text: "Soporte 24/7", included: false }
    ],
    cta: "Comenzar Gratis",
    href: "/registro"
  },
  {
    name: "Professional",
    description: "Para empresas agrícolas que necesitan control total y predicción avanzada.",
    price: "$199",
    billing: "por mes / silobolsa",
    popular: true,
    features: [
      { text: "Monitoreo de temp y humedad", included: true },
      { text: "Alertas vía WhatsApp/SMS", included: true },
      { text: "Historial ilimitado", included: true },
      { text: "Predicción IA avanzada", included: true },
      { text: "Monitoreo de CO2", included: false },
      { text: "Soporte 24/7", included: false }
    ],
    cta: "Prueba de 14 días",
    href: "/registro"
  },
  {
    name: "Enterprise",
    description: "Solución completa para acopiadores y cooperativas con gran volumen.",
    price: "Custom",
    billing: "facturación anual",
    popular: false,
    features: [
      { text: "Todo lo de Professional", included: true },
      { text: "Sensores multi-gas completos", included: true },
      { text: "Predicción IA de alto riesgo", included: true },
      { text: "API para integración ERP", included: true },
      { text: "Soporte dedicado 24/7", included: true },
      { text: "Instalación en campo bonificada", included: true }
    ],
    cta: "Contactar Ventas",
    href: "#contacto"
  }
];

export function PricingSection() {
  return (
    <section id="planes" className="py-10 relative bg-zinc-950/30 flex flex-col items-center overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="text-center mb-20 relative z-10 max-w-3xl px-4">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Planes flexibles para cada escala
        </h2>
        <p className="text-zinc-400 text-lg">
          Invertí centavos por tonelada y ahorrá miles de dólares en pérdidas. Sin contratos a largo plazo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-6 relative z-10">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative flex flex-col p-8 rounded-3xl border ${
              plan.popular 
                ? "bg-zinc-900/80 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]" 
                : "bg-zinc-950 border-white/10"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                Más Elegido
              </div>
            )}
            
            <div className="mb-8 border-b border-white/10 pb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-sm text-zinc-400 h-10 mb-6">{plan.description}</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-zinc-500 font-medium mb-1">{plan.billing}</span>}
              </div>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3 text-sm">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-zinc-700 shrink-0" />
                  )}
                  <span className={feature.included ? "text-zinc-200" : "text-zinc-600"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex justify-center mt-auto w-full">
              <Link href={plan.href} className="w-full">
                <LiquidButton 
                  className={`w-full py-6 rounded-full font-bold text-lg transition-all ${
                    plan.popular ? "text-white border-emerald-500" : "text-white border-white/20"
                  }`} 
                  size={'xl'}
                >
                  {plan.cta}
                </LiquidButton>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
