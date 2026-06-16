"use client";

import { useRef, useEffect } from "react";
import { Star, Quote } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations";
import BackgroundLayer from "@/components/BackgroundLayer";

const testimonials = [
  { name: "Carlos Gutiérrez", role: "Productor agrícola — Córdoba", quote: "El monitoreo con AGRILION nos salvó 80 toneladas de soja el año pasado. Detectamos un pico de humedad a tiempo que hubiera arruinado el lote entero." },
  { name: "María Fernanda López", role: "Ingeniera agrónoma — Buenos Aires", quote: "Poder ver la temperatura y humedad de cada silobolsa desde mi celular me da una tranquilidad enorme. Antes teníamos que ir lote por lote con el termómetro." },
  { name: "Ricardo Méndez", role: "Cooperativa Agropecuaria — Santa Fe", quote: "Implementamos AGRILION en 6 campos de la cooperativa. La plataforma es intuitiva y las alertas tempranas nos permitieron actuar antes de que cualquier problema escalara." },
];

export default function Testimonials() {
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
    <section id="testimonios" ref={containerRef} className="relative py-20 overflow-hidden">
      <BackgroundLayer variant="light-alt" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-[#15803d] tracking-widest uppercase">Testimonios</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-4">Lo que dicen nuestros usuarios</h2>
          <p className="text-lg text-gray-600">Productores de todo el país ya confían en AGRILION para proteger su cosecha.</p>
        </div>
        <div ref={gridRef} className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300">
              <Quote size={20} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={13} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
