"use client";

import { useState, useEffect } from "react";
import {
  Warehouse,
  Wifi,
  Battery,
  Thermometer,
  Droplets,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import DemoBadge from "@/components/DemoBadge";
import SiloMap from "@/components/dashboard/SiloMap";
import { SiloBag, Alert, DashboardStats } from "@/types";
import ClientChart from "@/components/ClientChart";

interface Props {
  stats: DashboardStats;
  silobags: SiloBag[];
  alerts: Alert[];
  onSelectBag: (id: string) => void;
}

function generateCurves(silobags: SiloBag[]) {
  const avgTemp = silobags.length
    ? silobags.reduce((s, b) => s + b.temperature, 0) / silobags.length
    : 24;
  const avgHum = silobags.length
    ? silobags.reduce((s, b) => s + b.humidity, 0) / silobags.length
    : 13;
  const seed = silobags.reduce((s, b) => s + b.temperature + b.humidity, 0);
  const tempData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}h`,
    temp: Math.round((avgTemp + Math.sin(i * 0.3) * 2 + Math.sin(seed + i * 1.7) * 0.75) * 10) / 10,
  }));
  const humidityData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}h`,
    hum: Math.round((avgHum + Math.cos(i * 0.25) * 2 + Math.cos(seed + i * 2.3) * 0.75) * 10) / 10,
  }));
  return { tempData, humidityData };
}

const severityBg: Record<string, string> = {
  info: "bg-blue-50 border-blue-100",
  warning: "bg-yellow-50 border-yellow-100",
  critical: "bg-red-50 border-red-100",
};

const severityDot: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
};

function computeRiskScore(stats: DashboardStats): { score: number; level: string; color: string; bg: string; label: string } {
  const total = stats.normalCount + stats.warningCount + stats.dangerCount || 1;
  const weighted = (stats.normalCount * 100 + stats.warningCount * 60 + stats.dangerCount * 20) / total;
  const alertPenalty = Math.min(stats.activeAlerts * 5, 20);
  const score = Math.max(Math.round(weighted - alertPenalty), 0);

  if (score >= 80) return { score, level: "bajo", color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Riesgo Bajo" };
  if (score >= 50) return { score, level: "medio", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Riesgo Moderado" };
  return { score, level: "alto", color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Riesgo Alto" };
}

function CountUp({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 600;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{displayed}</>;
}

export default function DashboardOverview({ stats, silobags, alerts, onSelectBag }: Props) {
  const risk = computeRiskScore(stats);
  const { tempData, humidityData } = generateCurves(silobags);
  const dangerBags = silobags.filter((s) => s.status === "danger");
  const warningBags = silobags.filter((s) => s.status === "warning");
  const priorityBags = [...dangerBags, ...warningBags, ...silobags.filter((s) => s.status === "normal")];

  return (
    <div className="space-y-6">
      {/* ESTADO GENERAL — Risk card as main focal point */}
      <div className={`${risk.bg} border rounded-2xl p-6 lg:p-8`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado General</p>
            <div className="flex items-center gap-3">
              <motion.span
                className={`text-5xl lg:text-6xl font-bold ${risk.color}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <CountUp value={risk.score} />
              </motion.span>
              <span className={`text-lg lg:text-xl font-semibold ${risk.color}`}>/ 100</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-3 h-3 rounded-full ${risk.score >= 80 ? "bg-green-500" : risk.score >= 50 ? "bg-yellow-500" : "bg-red-500"} animate-pulse`} />
              <span className={`text-base font-semibold ${risk.color}`}>{risk.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
            {[
              { icon: Warehouse, label: "Silobolsas", value: stats.totalSilobags, color: "text-[#1a5c3a]" },
              { icon: AlertTriangle, label: "Alertas", value: stats.activeAlerts, color: stats.activeAlerts > 0 ? "text-red-500" : "text-gray-400" },
              { icon: Wifi, label: "Sensores", value: `${stats.sensorsOnline}/${stats.totalSilobags}`, color: "text-[#1e7fb0]" },
              { icon: Battery, label: "Batería", value: `${stats.avgBattery}%`, color: stats.avgBattery < 50 ? "text-red-500" : "text-gray-700" },
            ].map((s, i) => (
              <div key={i} className="bg-white/80 rounded-xl px-4 py-3 border border-gray-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={14} className={s.color} />
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
                <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Silobolsas que necesitan atención */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle size={18} className={dangerBags.length > 0 ? "text-red-500" : "text-gray-300"} />
          {dangerBags.length > 0
            ? `${dangerBags.length} silobolsa${dangerBags.length > 1 ? "s" : ""} necesita${dangerBags.length > 1 ? "n" : ""} atención inmediata`
            : warningBags.length > 0
              ? `${warningBags.length} silobolsa${warningBags.length > 1 ? "s" : ""} en observación`
              : "Todas las silobolsas están en estado normal"}
        </h2>

        <div className="grid gap-3">
          {priorityBags.slice(0, 5).map((bag) => (
            <Link
              key={bag.id}
              href={`/dashboard/silo/${bag.id}`}
              className="flex items-center justify-between w-full bg-white rounded-xl px-5 py-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    bag.status === "danger" ? "bg-red-500 animate-pulse" : bag.status === "warning" ? "bg-yellow-500" : "bg-green-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{bag.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{bag.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                  <span>{bag.temperature}°C</span>
                  <span>{bag.humidity}% HR</span>
                  <span className="flex items-center gap-1">
                    <Battery size={12} />
                    {bag.battery}%
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    bag.status === "danger" ? "bg-red-50 text-red-600" : bag.status === "warning" ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"
                  }`}
                >
                  {bag.status === "danger" ? "Riesgo" : bag.status === "warning" ? "Alerta" : "Normal"}
                </span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer size={16} className="text-red-400" />
            <span className="text-sm font-semibold text-gray-600">Temperatura (últimas 24h)</span>
          </div>
          <ClientChart height="h-48" render={() => (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tempData}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d8a4e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2d8a4e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis hide domain={[18, 32]} />
                <Tooltip />
                <Area type="monotone" dataKey="temp" stroke="#2d8a4e" strokeWidth={2} fill="url(#tempGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )} />
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-gray-600">Humedad (últimas 24h)</span>
          </div>
          <ClientChart height="h-48" render={() => (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={humidityData}>
                <defs>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e7fb0" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#1e7fb0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis hide domain={[8, 20]} />
                <Tooltip />
                <Area type="monotone" dataKey="hum" stroke="#1e7fb0" strokeWidth={2} fill="url(#humGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )} />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            Alertas recientes
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.length === 0 && (
              <p className="text-sm text-gray-400 italic">No hay alertas activas</p>
            )}
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border ${severityBg[alert.severity]} cursor-pointer hover:shadow-sm transition-shadow`}
                onClick={() => onSelectBag(alert.siloBagId)}
              >
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${severityDot[alert.severity]}`} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{alert.siloBagName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mapa de silobolsas */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          Mapa de campo
          <DemoBadge />
        </h3>
        <SiloMap silobags={silobags} />
      </div>

      {/* Resumen de estado */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen de estado</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Normal", count: stats.normalCount, color: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
            { label: "Advertencia", count: stats.warningCount, color: "bg-yellow-500", text: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Riesgo", count: stats.dangerCount, color: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} rounded-xl p-4 text-center`}>
              <div className="flex justify-center mb-2">
                <span className={`w-3 h-3 rounded-full ${item.color}`} />
              </div>
              <p className={`text-2xl font-bold ${item.text}`}>{item.count}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
