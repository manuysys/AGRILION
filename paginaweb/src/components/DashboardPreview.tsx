"use client";

import { useRef, useEffect, useState } from "react";
import { Thermometer, Droplets, Battery } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import ClientChart from "@/components/ClientChart";
import { gsap, prefersReducedMotion, mouseTilt } from "@/lib/animations";
import { useCountUp } from "@/lib/use-count-up";
import BackgroundLayer from "@/components/BackgroundLayer";

const tempData = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}h`, temp: 24 + Math.sin(i * 0.5) * 3 + (Math.random() - 0.5),
}));

const humidityData = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}h`, hum: 13 + Math.cos(i * 0.4) * 2 + (Math.random() - 0.5),
}));

function StatCard({ end, label, highlight = false }: { end: number; label: string; highlight?: boolean }) {
  const { value, ref } = useCountUp({ end, duration: 1500, delay: 200 });
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
      <p className="text-sm text-gray-500 mb-0.5">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-red-600" : "text-gray-900"}`}>
        <span ref={ref}>{value}</span>
      </p>
    </div>
  );
}

export default function DashboardPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dashboardCardRef = useRef<HTMLDivElement>(null);
  const chartSectionRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const statusPillsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Main card scale-in from 0.96
      if (dashboardCardRef.current) {
        gsap.fromTo(dashboardCardRef.current,
          { scale: 0.96, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: containerRef.current, start: "top 80%", once: true }
          }
        );
      }

      // Chart panels stagger
      if (chartSectionRef.current) {
        gsap.fromTo(Array.from(chartSectionRef.current.children),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.12, duration: 0.5, ease: "power3.out",
            scrollTrigger: { trigger: containerRef.current, start: "top 70%", once: true }
          }
        );
      }

      // Alert rows slide in with stagger
      if (rowsRef.current?.children) {
        gsap.fromTo(Array.from(rowsRef.current.children),
          { x: -16, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: "power2.out",
            scrollTrigger: { trigger: containerRef.current, start: "top 65%", once: true }
          }
        );
      }

      // Mouse tilt on dashboard card
      if (dashboardCardRef.current) mouseTilt(dashboardCardRef.current, { maxTilt: 3, perspective: 1200 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShowCharts(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="dashboard-preview" ref={containerRef} className="relative py-24 overflow-hidden bg-[#0a1a10]">
      <BackgroundLayer variant="dark" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold text-[#15803d] tracking-widest uppercase">Dashboard</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Panel de control en tiempo real</h2>
          <p className="text-lg text-gray-300">Visualice el estado completo de sus silobolsas con gráficos interactivos y alertas inteligentes.</p>
        </div>

        <div ref={dashboardCardRef} className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">Sistema operativo</span>
            </div>
            <span className="text-xs text-gray-400">Actualizado hace 2 min</span>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid lg:grid-cols-4 gap-4">
              <StatCard end={12} label="Silobolsas activas" />
              <StatCard end={3} label="Alertas abiertas" highlight />
              <StatCard end={11} label="Sensores online" />
              <StatCard end={78} label="Batería promedio" />
            </div>

            <div ref={chartSectionRef} className="grid lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer size={16} className="text-red-400" />
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Temperatura</span>
                </div>
                <div className="h-32 relative">
                  {showCharts && (
                    <div className="absolute inset-0">
                      <ClientChart height="h-full" render={() => (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={tempData}>
                            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis hide domain={[20, 30]} />
                            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px" }} />
                            <Line type="monotone" dataKey="temp" stroke="#15803d" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1200} />
                          </LineChart>
                        </ResponsiveContainer>
                      )} />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets size={16} className="text-blue-400" />
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Humedad</span>
                </div>
                <div className="h-32 relative">
                  {showCharts && (
                    <div className="absolute inset-0">
                      <ClientChart height="h-full" render={() => (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={humidityData}>
                            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis hide domain={[10, 18]} />
                            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px" }} />
                            <Line type="monotone" dataKey="hum" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1200} />
                          </LineChart>
                        </ResponsiveContainer>
                      )} />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Battery size={16} className="text-green-500" />
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Batería</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Lote Norte A", bat: 85 },
                    { name: "Lote Este", bat: 67 },
                    { name: "Lote Sur A", bat: 34 },
                    { name: "Lote Oeste", bat: 73 },
                  ].map((bag, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{bag.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${bag.bat > 60 ? "bg-green-500" : bag.bat > 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${bag.bat}%` }} />
                        </div>
                        <span className={`text-sm font-medium w-7 text-right ${bag.bat > 60 ? "text-green-600" : bag.bat > 40 ? "text-yellow-600" : "text-red-600"}`}>{bag.bat}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div ref={alertsRef} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Estado de silobolsas</span>
                <span className="text-sm text-gray-400">5 lotes monitoreados</span>
              </div>
              <div ref={rowsRef} className="divide-y divide-gray-100">
                {[
                  { name: "Lote Norte A", temp: "24.5°C", hum: "12.3%", bat: 85, status: "normal" as const },
                  { name: "Lote Este", temp: "27.2°C", hum: "15.8%", bat: 67, status: "warning" as const },
                  { name: "Lote Sur A", temp: "31.4°C", hum: "18.2%", bat: 34, status: "danger" as const },
                  { name: "Lote Oeste", temp: "22.1°C", hum: "11.5%", bat: 73, status: "normal" as const },
                  { name: "Lote Central", temp: "26.7°C", hum: "16.3%", bat: 56, status: "warning" as const },
                ].map((bag, i) => {
                  const s = {
                    normal: { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50", label: "Normal" },
                    warning: { dot: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50", label: "Advertencia" },
                    danger: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", label: "Riesgo" },
                  }[bag.status];
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${s.dot} ${bag.status === "danger" ? "animate-pulse" : ""}`} />
                        <span className="text-sm font-medium text-gray-700">{bag.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{bag.temp}</span>
                        <span className="text-gray-500">{bag.hum}</span>
                        <span
                          ref={(el) => { statusPillsRef.current[i] = el; }}
                          className={`px-2 py-0.5 rounded-full text-sm font-medium ${s.bg} ${s.text} animate-status-pill`}
                        >
                          {s.label}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400"><Battery size={13} /> {bag.bat}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
