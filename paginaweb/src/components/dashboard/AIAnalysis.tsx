"use client";

import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Thermometer,
  Droplets,
  Wind,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import DemoBadge from "@/components/DemoBadge";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { SiloBag, SiloBagDetail } from "@/types";

interface Props {
  silobags: SiloBag[];
  getDetail: (id: string) => SiloBagDetail | undefined;
}

function trendText(history: { value: number }[]): { direction: string; pct: string; icon: typeof TrendingUp } {
  if (history.length < 2) return { direction: "estable", pct: "0%", icon: Minus };
  const first = history[0].value;
  const last = history[history.length - 1].value;
  const diff = ((last - first) / first) * 100;
  if (diff > 2) return { direction: "ascendente", pct: `+${diff.toFixed(1)}%`, icon: TrendingUp };
  if (diff < -2) return { direction: "descendente", pct: `${diff.toFixed(1)}%`, icon: TrendingDown };
  return { direction: "estable", pct: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`, icon: Minus };
}

function analysisText(bag: SiloBag, detail?: SiloBagDetail): string {
  if (bag.status === "danger") {
    return `${bag.name} presenta condiciones críticas. Temperatura a ${bag.temperature}°C y humedad al ${bag.humidity}%. ` +
      (detail
        ? `En las últimas horas se observa una tendencia ${trendText(detail.temperatureHistory).direction}. ` +
          `Probabilidad estimada de deterioro: ${bag.humidity > 18 ? "alta (>60%)" : "moderada (30-60%)"}.`
        : "Se recomienda intervención inmediata.");
  }
  if (bag.status === "warning") {
    return `${bag.name} muestra signos tempranos de alerta. Temperatura: ${bag.temperature}°C, Humedad: ${bag.humidity}%. ` +
      (detail
        ? `La tendencia de humedad es ${trendText(detail.humidityHistory).direction} (${trendText(detail.humidityHistory).pct}) en las últimas horas. ` +
          `Probabilidad estimada de deterioro: baja-media (<30%).`
        : "Se recomienda aumentar frecuencia de monitoreo.");
  }
  return `${bag.name} se encuentra en condiciones normales. Temperatura: ${bag.temperature}°C, Humedad: ${bag.humidity}%. Sin anomalías detectadas.`;
}

function recommendationText(bag: SiloBag): string {
  if (bag.status === "danger") return "Inspección presencial inmediata. Monitorear cada 30 min.";
  if (bag.status === "warning") return "Aumentar monitoreo a cada 1 h. Preparar plan de contingencia.";
  return "Monitoreo rutinario c/2 h. Sin acciones requeridas.";
}

export default function AIAnalysis({ silobags, getDetail }: Props) {
  const highRisk = silobags.filter((s) => s.risk === "alto");
  const mediumRisk = silobags.filter((s) => s.risk === "medio");

  const allDetails = silobags
    .map((s) => getDetail(s.id))
    .filter(Boolean) as SiloBagDetail[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain size={24} className="text-purple-500" />
          AGRILION AI
          <DemoBadge />
        </h2>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <Brain size={22} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Resumen inteligente</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {highRisk.length > 0
                ? `Se detectaron ${highRisk.length} silobolsa${highRisk.length > 1 ? "s" : ""} con riesgo alto y ${mediumRisk.length} con riesgo medio. La humedad es el factor crítico dominante. `
                : mediumRisk.length > 0
                ? `No hay silobolsas en riesgo crítico, pero ${mediumRisk.length} requieren atención. Las temperaturas muestran una tendencia estable en general.`
                : "Todas las silobolsas en condiciones óptimas. Sin anomalías significativas."}
              {allDetails.length > 0 && ` Último análisis: ${new Date().toLocaleTimeString("es-AR")}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Análisis individual por silobolsa */}
      <motion.div
        className="grid lg:grid-cols-2 gap-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-20px" }}
      >
        {silobags.slice(0, 6).map((bag, i) => {
          const detail = allDetails.find((d) => d.id === bag.id);
          return (
            <motion.div key={bag.id} variants={fadeInUp} custom={i}>
            <Link
              href={`/dashboard/silo/${bag.id}`}
              className={`block bg-white rounded-2xl border p-5 hover:shadow-lg transition-all group ${
                bag.status === "danger" ? "border-red-200 hover:border-red-300" : bag.status === "warning" ? "border-yellow-200 hover:border-yellow-300" : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${bag.status === "danger" ? "bg-red-500 animate-pulse" : bag.status === "warning" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <span className="text-sm font-semibold text-gray-800">{bag.name}</span>
                </div>
                <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{analysisText(bag, detail)}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-red-500">
                  <Thermometer size={12} /> {bag.temperature}°C
                </span>
                <span className="flex items-center gap-1 text-blue-500">
                  <Droplets size={12} /> {bag.humidity}%
                </span>
                <span className="flex items-center gap-1 text-purple-500">
                  <Wind size={12} /> {bag.co2 || 400} ppm
                </span>
              </div>
              {bag.risk !== "bajo" && (
                <div className="mt-3 flex items-start gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  {recommendationText(bag)}
                </div>
              )}
            </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-700">Recomendaciones del sistema</h3>
        </div>
        <div className="space-y-3">
          {highRisk.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-700 font-medium">Intervención requerida</p>
                <p className="text-sm text-red-600 mt-0.5">
                  Inspección inmediata en {highRisk.map((s) => s.name).join(", ")}. Alta probabilidad de deterioro.
                </p>
              </div>
            </div>
          )}
          {mediumRisk.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Monitoreo reforzado</p>
                <p className="text-sm text-yellow-600 mt-0.5">
                  {mediumRisk.map((s) => s.name).join(", ")} — programar revisión en 24-48 hs.
                </p>
              </div>
            </div>
          )}
          {highRisk.length === 0 && mediumRisk.length === 0 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
              <TrendingDown size={16} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-green-700 font-medium">Todo en orden</p>
                <p className="text-sm text-green-600 mt-0.5">Parámetros dentro de rangos óptimos. Sin riesgo de deterioro.</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Wind size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-blue-700 font-medium">Recomendación general</p>
              <p className="text-sm text-blue-600 mt-0.5">
                Mantener frecuencia de monitoreo cada 2 horas. Los sensores con batería baja ({silobags.filter((s) => s.battery < 50).length}) requieren reemplazo próximo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
