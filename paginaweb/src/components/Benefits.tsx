"use client";

import { useRef, useEffect } from "react";
import { SearchCheck, TrendingDown, Satellite, Bell, Battery, History } from "lucide-react";
import { gsap, prefersReducedMotion, mouseTilt, glareEffect } from "@/lib/animations";
import BackgroundLayer from "@/components/BackgroundLayer";

const benefits = [
  { icon: SearchCheck, title: "Detección temprana", description: "Identifique signos de deterioro antes de que afecten la calidad del grano, gracias al monitoreo continuo de múltiples variables en cada silobolsa." },
  { icon: TrendingDown, title: "Menos pérdidas", description: "Reduzca significativamente las pérdidas post-cosecha actuando a tiempo ante cualquier anomalía detectada por el sistema de IA." },
  { icon: Satellite, title: "Monitoreo remoto", description: "Acceda al estado de sus silobolsas desde cualquier lugar a través del dashboard web o la aplicación móvil." },
  { icon: Bell, title: "Alertas automáticas", description: "Reciba notificaciones instantáneas ante condiciones de riesgo sin necesidad de estar supervisando constantemente." },
  { icon: Battery, title: "Bajo consumo", description: "Sensores de ultra bajo consumo con baterías que duran entre 6 y 12 meses, diseñados para operación autónoma en campo." },
  { icon: History, title: "Historial completo", description: "Acceda al registro histórico de cada silobolsa para analizar tendencias y optimizar sus decisiones de almacenamiento." },
];

export default function Benefits() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const glareRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconWrapRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.children ? Array.from(gridRef.current.children) : [];

      // Premium layered reveal: cards enter with clip + translate + fade
      gsap.set(cards, { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", y: 24, opacity: 0 });
      gsap.to(cards, {
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        y: 0, opacity: 1,
        duration: 0.6, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 80%", once: true },
      });

      // Hover effects: tilt + glare
      cardRefs.current.forEach((card, i) => {
        if (card) {
          mouseTilt(card, { maxTilt: 4, perspective: 1000 });
          glareEffect(card, glareRefs.current[i]);
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="beneficios" ref={containerRef} className="relative py-20 overflow-hidden">
      <BackgroundLayer variant="light" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-[#15803d] tracking-widest uppercase">Beneficios</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-4">Proteja su cosecha con tecnología</h2>
          <p className="text-lg text-gray-600">Cada funcionalidad de AGRILION está diseñada para maximizar la conservación de sus granos y minimizar pérdidas.</p>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="relative bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-shadow duration-300 will-change-transform overflow-hidden"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Glare overlay */}
              <div
                ref={(el) => { glareRefs.current[i] = el; }}
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{ background: "transparent" }}
              />
              <div
                ref={(el) => { iconWrapRefs.current[i] = el; }}
                className="w-10 h-10 rounded-lg bg-[#15803d]/10 flex items-center justify-center mb-3 relative group-hover:animate-icon-glow"
              >
                <b.icon size={20} className="text-[#15803d] relative z-10" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 relative z-10">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed relative z-10">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
