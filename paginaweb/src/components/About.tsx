"use client";

import { useRef, useEffect } from "react";
import { Target, Eye, Leaf } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations";
import BackgroundLayer from "@/components/BackgroundLayer";

const items = [
  { icon: Target, title: "Misión", description: "Proteger la cosecha almacenada de los productores agropecuarios mediante tecnología de monitoreo inteligente, reduciendo pérdidas post-cosecha y optimizando la toma de decisiones en el campo.", accent: "#15803d" },
  { icon: Eye, title: "Visión", description: "Ser la plataforma de referencia en monitoreo inteligente de almacenamiento agrícola en Latinoamérica, transformando la gestión de silobolsas con datos y tecnología accesible.", accent: "#2563eb" },
  { icon: Leaf, title: "Propósito", description: "Nacimos del problema real que enfrentan los productores: no saber qué pasa dentro de una silobolsa hasta que es demasiado tarde. AGRILION cierra esa brecha con sensores, LoRa, IA y un dashboard claro.", accent: "#7c3aed" },
];

export default function About() {
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
    <section id="nosotros" ref={containerRef} className="relative py-20 overflow-hidden">
      <BackgroundLayer variant="light-alt" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-[#15803d] tracking-widest uppercase">Nosotros</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-4">Tecnología para el agro</h2>
          <p className="text-lg text-gray-600">AGRILION nace de la necesidad de proteger el grano almacenado con datos concretos, no con suposiciones.</p>
        </div>
        <div ref={gridRef} className="grid sm:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${item.accent}12` }}>
                <item.icon size={20} style={{ color: item.accent }} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
