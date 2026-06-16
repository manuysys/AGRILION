"use client";

import { useRef, useEffect } from "react";
import { Wifi, Radio, Satellite, Brain, LayoutDashboard, Bell } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations";
import BackgroundLayer from "@/components/BackgroundLayer";

const steps = [
  { icon: Wifi, title: "Sensor IoT", description: "Sensores de temperatura, humedad y gases instalados dentro de cada silobolsa miden constantemente las condiciones del grano almacenado.", accent: "#15803d" },
  { icon: Radio, title: "Transmisión LoRa", description: "Los datos se transmiten cada 1-2 horas mediante radiofrecuencia LoRa de largo alcance y ultra bajo consumo.", accent: "#2563eb" },
  { icon: Satellite, title: "Gateway", description: "Los gateways de campo recolectan las señales de múltiples sensores y las retransmiten a la nube vía internet satelital o 4G.", accent: "#0891b2" },
  { icon: Brain, title: "Análisis con IA", description: "Los datos se procesan en la nube con algoritmos de inteligencia artificial que detectan patrones anómalos y anticipan riesgos.", accent: "#7c3aed" },
  { icon: LayoutDashboard, title: "Dashboard", description: "El productor visualiza el estado de todos sus silobolsas en un panel de control web con gráficos y alertas en tiempo real.", accent: "#ca8a04" },
  { icon: Bell, title: "Alerta temprana", description: "El productor recibe notificaciones en tiempo real ante cualquier anomalía, permitiendo actuar antes de que se produzcan pérdidas.", accent: "#dc2626" },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      gsap.set(stepRefs.current.filter(Boolean), { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stepRefs.current.filter(Boolean),
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="como-funciona" ref={containerRef} className="relative py-24 overflow-hidden bg-[#0a1a10]">
      <BackgroundLayer variant="semi-dark" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-[#15803d] tracking-widest uppercase">Cómo funciona</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Del sensor a la decisión</h2>
          <p className="text-lg text-gray-300">Un flujo continuo de datos que convierte información en acciones preventivas para proteger su cosecha.</p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16 lg:gap-y-20">
            {steps.map((step, i) => (
              <div
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/10 backdrop-blur-sm group-hover:shadow-md group-hover:border-white/20 transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${step.accent}15` }}>
                    <step.icon size={20} style={{ color: step.accent }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: step.accent }}>{i + 1}</span>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed max-w-[260px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
