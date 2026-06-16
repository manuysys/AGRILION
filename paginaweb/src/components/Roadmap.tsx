"use client";

import { useRef, useEffect } from "react";
import { CheckCircle, Clock, Cpu, Smartphone, BarChart3 } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations";
import BackgroundLayer from "@/components/BackgroundLayer";

const phases = [
  { icon: CheckCircle, title: "MVP", desc: "Sensores IoT, LoRa y dashboard web básico implementados", status: "completado", date: "2025–2026" },
  { icon: Smartphone, title: "App móvil", desc: "Aplicación nativa para monitoreo desde cualquier dispositivo móvil", status: "desarrollo", date: "2026" },
  { icon: Cpu, title: "IA predictiva", desc: "Modelos de machine learning para anticipar deterioro del grano", status: "desarrollo", date: "2026" },
  { icon: BarChart3, title: "Reportes avanzados", desc: "Informes personalizados, exportación de datos históricos y analytics", status: "próximo", date: "2027" },
];

const statusConfig: Record<string, { label: string; style: string }> = {
  completado: { label: "Completado", style: "bg-green-50 text-green-700 border-green-200" },
  desarrollo: { label: "En desarrollo", style: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  próximo: { label: "Próximo", style: "bg-gray-50 text-gray-500 border-gray-200" },
};

export default function Roadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.children ? Array.from(gridRef.current.children) : [];
      gsap.fromTo(cards, { y: 16, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 80%" },
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="roadmap" ref={containerRef} className="relative py-20 overflow-hidden">
      <BackgroundLayer variant="light-alt" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-[#15803d] tracking-widest uppercase">Roadmap</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-4">Hoja de ruta</h2>
          <p className="text-lg text-gray-600">Conozca las próximas funcionalidades que estamos desarrollando para AGRILION.</p>
        </div>
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {phases.map((p, i) => {
            const cfg = statusConfig[p.status];
            return (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.style} mb-3`}>
                  {cfg.label}
                </span>
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-3">
                  <p.icon size={18} className="text-gray-700" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{p.desc}</p>
                <span className="text-xs text-gray-400">{p.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
