"use client";

import { useRef, useEffect } from "react";
import { ArrowRight, BarChart3, Bell, Wifi, Thermometer, Droplets } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "@/lib/animations";
import { heroEntrance, mouseTilt, magneticPull, prefersReducedMotion } from "@/lib/animations";
import { useCountUp } from "@/lib/use-count-up";
import BackgroundLayer from "@/components/BackgroundLayer";

function MetricCard({ end, label, highlight, suffix = "" }: { end: number; label: string; highlight?: boolean; suffix?: string }) {
  const { value, ref } = useCountUp({ end, duration: 1500, delay: 400 });
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-red-600" : "text-gray-900"}`}>
        <span ref={ref}>{value}</span>{suffix}
      </p>
    </div>
  );
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const primaryCtaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const wordEls = wordsRef.current.filter(Boolean);
      heroEntrance({
        badge: badgeRef.current,
        headlineWords: wordEls,
        subtext: subtextRef.current,
        ctas: ctasRef.current,
        pills: pillsRef.current,
        card: cardRef.current,
      });
      if (cardInnerRef.current) mouseTilt(cardInnerRef.current, { maxTilt: 5, perspective: 1200 });
      if (primaryCtaRef.current) magneticPull(primaryCtaRef.current, { strength: 12 });

      // Card gentle float
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          y: -6,
          duration: 3.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Split headline into words for per-word animation
  const headlineParts = "Proteja su cosecha con ".split(" ");
  const headlineHighlight = "sensores e IA";

  return (
    <section ref={containerRef} id="inicio" className="relative min-h-screen flex items-center overflow-hidden bg-[#06120a]">
      <BackgroundLayer variant="hero-dark" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2 space-y-5">
            <span ref={badgeRef} className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-emerald-300 text-sm font-medium rounded-full">
              Monitoreo inteligente de silobolsas
            </span>

            <h1 ref={headlineRef} className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white max-w-xl">
              <span className="inline-flex flex-wrap gap-x-[0.2em]">
                {headlineParts.map((word, i) => (
                  <span key={i} ref={(el) => { if (el) wordsRef.current[i] = el; }} className="inline-block">
                    {word}{i < headlineParts.length - 1 ? "\u00A0" : ""}
                  </span>
                ))}
                <span className="inline-block text-emerald-400">
                  {headlineHighlight.split(" ").map((word, j) => (
                    <span key={`hl-${j}`} ref={(el) => { if (el) wordsRef.current[headlineParts.length + j] = el; }} className="inline-block">
                      {word}{j < headlineHighlight.split(" ").length - 1 ? "\u00A0" : ""}
                    </span>
                  ))}
                </span>
              </span>
            </h1>

            <p ref={subtextRef} className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-lg">
              Detecte deterioro, humedad y temperatura antes de que generen pérdidas. Sensores IoT en cada silobolsa, comunicación LoRa y análisis predictivo en tiempo real.
            </p>

            <div ref={pillsRef} className="flex flex-wrap items-center gap-5 pt-2 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Wifi size={17} className="text-[#15803d]" /><span>IoT + LoRa</span></div>
              <div className="flex items-center gap-2"><BarChart3 size={17} className="text-[#15803d]" /><span>Dashboard cloud</span></div>
              <div className="flex items-center gap-2"><Bell size={17} className="text-[#15803d]" /><span>Alertas tempranas</span></div>
            </div>

            <div ref={ctasRef} className="flex flex-wrap gap-3 pt-1">
              <a
                ref={primaryCtaRef}
                href="#contacto"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#15803d] text-white font-semibold rounded-lg hover:bg-[#166534] transition-all shadow-sm text-base"
              >
                Solicitar demo <ArrowRight size={19} />
              </a>
              <Link href="#dashboard-preview" className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-semibold rounded-lg hover:border-white/40 transition-all text-base">
                Ver dashboard
              </Link>
            </div>
          </div>

          <div ref={cardRef} className="lg:col-span-3 relative" style={{ perspective: "1200px" }}>
            <div ref={cardInnerRef} className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-black/20 overflow-hidden will-change-transform" style={{ transformStyle: "preserve-3d" }}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-gray-700">Sistema operativo</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Thermometer size={13} className="text-red-400" /> 24.5°C
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Droplets size={13} className="text-blue-400" /> 12.3%
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <MetricCard end={12} label="Silobolsas" />
                  <MetricCard end={3} label="Alertas" highlight />
                  <MetricCard end={11} label="Sensores" suffix="/12" />
                  <MetricCard end={78} label="Batería" suffix="%" />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Últimas alertas</span>
                      <span className="text-xs text-gray-400">Hoy</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { lote: "Lote Sur A", riesgo: "Alto", temp: "31.4°C", hum: "18.2%", color: "red" },
                        { lote: "Lote Central", riesgo: "Medio", temp: "27.2°C", hum: "15.8%", color: "yellow" },
                        { lote: "Lote Norte B", riesgo: "Bajo", temp: "23.8°C", hum: "11.2%", color: "green" },
                      ].map((a, i) => {
                        const dotColor = a.color === "red" ? "bg-red-500" : a.color === "yellow" ? "bg-yellow-500" : "bg-green-500";
                        const bgBadge = a.color === "red" ? "bg-red-100 text-red-700" : a.color === "yellow" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
                        return (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${dotColor} ${a.color === "red" ? "animate-pulse" : ""}`} />
                              <span className="text-gray-700 font-medium">{a.lote}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                              <span>{a.temp}</span>
                              <span>{a.hum}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${bgBadge}`}>{a.riesgo}</span>
                            </div>
                          </div>
                        );})}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Sensores</span>
                    <div className="space-y-2">
                      {[
                        { name: "Lote Norte A", bat: 85 },
                        { name: "Lote Este", bat: 67 },
                        { name: "Lote Sur A", bat: 34 },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">{s.name}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${s.bat > 60 ? "bg-green-500" : s.bat > 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${s.bat}%` }} />
                            </div>
                            <span className={`text-xs font-medium w-6 text-right ${s.bat > 60 ? "text-green-600" : s.bat > 40 ? "text-yellow-600" : "text-red-600"}`}>{s.bat}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    IA predictiva activa — 0 anomalías detectadas
                  </span>
                  <Link href="/dashboard" className="text-[#15803d] hover:text-[#166534] font-medium transition-colors">
                    Ver dashboard completo →
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-3 lg:-right-3 w-full h-full border-2 border-white/10 rounded-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
