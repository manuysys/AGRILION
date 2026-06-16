"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Wind,
  Battery,
  Wifi,
  WifiOff,
  Clock,
  Brain,
  AlertTriangle,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ClientChart from "@/components/ClientChart";
import EventTimeline from "@/components/EventTimeline";
import DemoBadge from "@/components/DemoBadge";
import { fadeInUp } from "@/lib/motion";
import { fetchSiloDetail } from "@/lib/data-service";
import { SiloBagDetail } from "@/types";

export default function SiloDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<SiloBagDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiloDetail(id).then((d) => {
      setDetail(d || null);
      setLoading(false);
    });
  }, [id]);

  const statusColor: Record<string, string> = {
    danger: "text-red-600 bg-red-50 border-red-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    normal: "text-green-600 bg-green-50 border-green-200",
  };

  const statusDot: Record<string, string> = {
    danger: "bg-red-500",
    warning: "bg-yellow-500",
    normal: "bg-green-500",
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="silobolsas" onTabChange={() => {}}>
        <div className="flex items-center justify-center h-64">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 border-4 border-[#1a5c3a] border-t-transparent rounded-full animate-spin" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!detail) {
    return (
      <DashboardLayout activeTab="silobolsas" onTabChange={() => {}}>
        <div className="text-center py-16">
          <p className="text-gray-500">Silobolsa no encontrada</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-[#1a5c3a] hover:underline">
            Volver
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const riskScore = Math.max(0, Math.round(100 - (detail.temperature - 20) * 3 - (detail.humidity - 10) * 2));
  const riskLabel = riskScore < 40 ? "Riesgo Alto" : riskScore < 70 ? "Riesgo Moderado" : "Riesgo Bajo";

  return (
    <DashboardLayout activeTab="silobolsas" onTabChange={() => {}}>
      <motion.div
        className="space-y-6 max-w-5xl"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Header con breadcrumb */}
        <motion.div className="flex items-center gap-3" variants={fadeInUp}>
          <button onClick={() => router.back()} aria-label="Volver" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Dashboard</span>
              <span>/</span>
              <span>Silobolsas</span>
              <span>/</span>
              <span className="text-gray-600 font-medium">{detail.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl font-bold text-gray-900">{detail.name}</h1>
              <DemoBadge />
            </div>
          </div>
        </motion.div>

        {/* Risk Card */}
        <motion.div variants={fadeInUp} className={`rounded-2xl border p-6 ${statusColor[detail.status]}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-70">Estado General</p>
              <div className="flex items-baseline gap-2 mt-1">
                <motion.span
                  className="text-5xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  {riskScore}
                </motion.span>
                <span className="text-lg font-semibold opacity-70">/ 100</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-3 h-3 rounded-full ${statusDot[detail.status]} animate-pulse`} />
                <span className="font-semibold">{riskLabel}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
              {[
                { icon: Thermometer, label: "Temperatura", value: `${detail.temperature}°C`, color: "text-red-500" },
                { icon: Droplets, label: "Humedad", value: `${detail.humidity}%`, color: "text-blue-500" },
                { icon: Wind, label: "CO₂", value: `${detail.co2 || 400} ppm`, color: "text-purple-500" },
                { icon: Battery, label: "Batería", value: `${detail.battery}%`, color: detail.battery < 50 ? "text-red-500" : "text-gray-700" },
              ].map((s, i) => (
                <div key={i} className="bg-white/70 rounded-xl px-3 py-2.5 border border-white/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <s.icon size={12} className={s.color} />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Thermometer size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-gray-600">Historial de temperatura</span>
            </div>
            <ClientChart height="h-48" render={() => (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detail.temperatureHistory}>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2d8a4e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )} />
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Droplets size={16} className="text-blue-400" />
              <span className="text-sm font-semibold text-gray-600">Historial de humedad</span>
            </div>
            <ClientChart height="h-48" render={() => (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detail.humidityHistory}>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#1e7fb0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )} />
          </div>
        </div>

        {/* AI Analysis + Events */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-purple-500" />
              <span className="text-sm font-semibold text-gray-600">Análisis de IA</span>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{detail.aiAnalysis}</p>
              <div className="mt-3 pt-3 border-t border-purple-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-purple-500 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-purple-700">{detail.aiRecommendation}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Historial de eventos</span>
            </div>
            <EventTimeline events={detail.events} />
          </div>
        </div>

        {/* Info footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 bg-white rounded-2xl p-4 border border-gray-100">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            Última actualización: {detail.lastUpdate}
          </span>
          <span className="flex items-center gap-1.5">
            {detail.sensorOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-400" />}
            Sensor {detail.sensorOnline ? "conectado" : "desconectado"}
          </span>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
