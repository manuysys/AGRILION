"use client";

import { useRef, useEffect } from "react";
import { Smartphone, Bell, Eye, History, AlertTriangle } from "lucide-react";
import { gsap, prefersReducedMotion, parallaxY } from "@/lib/animations";
import BackgroundLayer from "@/components/BackgroundLayer";

const features = [
  { icon: Bell, text: "Notificaciones en tiempo real" },
  { icon: Eye, text: "Estado desde cualquier lugar" },
  { icon: History, text: "Historial completo de mediciones" },
  { icon: AlertTriangle, text: "Alertas inmediatas de riesgo" },
];

export default function AppPromo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const phoneScreenRef = useRef<HTMLDivElement>(null);
  const phoneGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Phone gentle float
      if (phoneRef.current) {
        gsap.to(phoneRef.current, {
          y: -8,
          rotateZ: 0.5,
          duration: 4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      // Phone glow parallax
      if (phoneGlowRef.current) parallaxY(phoneGlowRef.current, 0.06);

      // Content entrance: staggered sequence
      const contentChildren = contentRef.current?.children ? Array.from(contentRef.current.children) : [];
      gsap.fromTo(contentChildren, { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 80%", once: true },
      });

      // Feature items stagger
      if (featureRefs.current.length > 0) {
        gsap.fromTo(featureRefs.current.filter(Boolean), { x: -16, opacity: 0 }, {
          x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out",
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
        });
      }

      // Phone entrance with rotation
      if (phoneRef.current) {
        gsap.fromTo(phoneRef.current, { y: 30, opacity: 0, rotateY: -8, scale: 0.95 }, {
          y: 0, opacity: 1, rotateY: 0, scale: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
        });
      }

      // Phone screen content animates in sequence
      if (phoneScreenRef.current?.children) {
        gsap.fromTo(Array.from(phoneScreenRef.current.children),
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: "power2.out",
            scrollTrigger: { trigger: containerRef.current, start: "top 70%", once: true },
          }
        );
      }

      // Notification slides into the phone once
      if (notificationRef.current) {
        gsap.set(notificationRef.current, { x: 60, opacity: 0 });
        gsap.to(notificationRef.current, {
          x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)",
          scrollTrigger: { trigger: containerRef.current, start: "top 65%", once: true },
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="app" ref={containerRef} className="relative py-20 overflow-hidden">
      <BackgroundLayer variant="light" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div ref={contentRef} className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#15803d]/10 text-[#15803d] text-sm font-medium rounded-full">
              <Smartphone size={15} /> Aplicación móvil
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Lleve el monitoreo de sus silobolsas en el bolsillo</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              La aplicación AGRILION complementa el dashboard web para que pueda consultar el estado de sus silobolsas desde cualquier lugar, directamente desde su celular.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} ref={(el) => { featureRefs.current[i] = el; }} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#15803d]/10 flex items-center justify-center shrink-0">
                    <f.icon size={16} className="text-[#15803d]" />
                  </div>
                  <span className="text-sm text-gray-600 pt-1.5">{f.text}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400">Disponible próximamente en App Store y Google Play</p>
          </div>

          <div ref={phoneRef} className="flex justify-center will-change-transform" style={{ transformStyle: "preserve-3d", perspective: "1200px" }}>
            <div className="relative">
              {/* Background glow */}
              <div ref={phoneGlowRef} className="absolute -inset-8 bg-gradient-to-br from-[#15803d]/8 via-transparent to-[#2563eb]/8 rounded-[60px] blur-2xl -z-10" />
              <div className="w-60 h-[420px] sm:w-72 sm:h-[460px] bg-gray-900 rounded-[40px] p-3 shadow-xl border border-gray-200" style={{ transformStyle: "preserve-3d" }}>
                <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 flex items-center justify-center">
                    <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
                  </div>
                  <div ref={phoneScreenRef} className="pt-8 px-5 pb-5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-6 h-6 bg-[#15803d] rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">A</span>
                      </div>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-gray-900 text-sm font-semibold mb-3">Lote Norte A</p>
                    <div className="space-y-2 mb-4">
                      {[["Temp", "24.5°C", "text-gray-900"], ["Humedad", "12.3%", "text-gray-900"], ["Batería", "85%", "text-green-600"]].map(([l, v, c], i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-500">{l}</span>
                          <span className={`text-sm font-semibold ${c}`}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-green-700 font-semibold">✓ Estado normal</p>
                    </div>
                    {/* Notification slide-in */}
                    <div ref={notificationRef} className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Alerta: Lote Sur A — humedad elevada
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="w-full h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-400">Última sincro: 2 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
