"use client";

import {
  X,
  Thermometer,
  Droplets,
  Battery,
  Wifi,
  Clock,
  AlertTriangle,
  Brain,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SiloBagDetail } from "@/types";
import ClientChart from "@/components/ClientChart";

interface Props {
  detail: SiloBagDetail;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  normal: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  danger: "text-red-600 bg-red-50",
};
const statusLabel: Record<string, string> = {
  normal: "Normal",
  warning: "Advertencia",
  danger: "Riesgo",
};
const batteryColor = (v: number) =>
  v > 60 ? "text-green-500" : v > 40 ? "text-yellow-500" : "text-red-500";

export default function SiloBagDetailView({ detail, onClose }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${
            detail.status === "normal" ? "bg-green-500" : detail.status === "warning" ? "bg-yellow-500" : "bg-red-500"
          }`} />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{detail.name}</h3>
            <p className="text-xs text-gray-400">{detail.location}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Thermometer, label: "Temperatura", value: `${detail.temperature}°C`, color: "text-red-500" },
            { icon: Droplets, label: "Humedad", value: `${detail.humidity}%`, color: "text-blue-500" },
            { icon: Battery, label: "Batería", value: `${detail.battery}%`, color: batteryColor(detail.battery) },
            { icon: Wifi, label: "Sensor", value: detail.sensorOnline ? "Online" : "Offline", color: detail.sensorOnline ? "text-green-500" : "text-red-400" },
          ].map((item, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
              <item.icon size={18} className={`mx-auto mb-2 ${item.color}`} />
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Thermometer size={14} className="text-red-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Historial de temperatura
              </span>
            </div>
            <ClientChart height="h-40" render={() => (
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

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Historial de humedad
              </span>
            </div>
            <ClientChart height="h-40" render={() => (
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

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-purple-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Análisis de IA
            </span>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {detail.aiAnalysis}
            </p>
            <div className="mt-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-purple-700">
                {detail.aiRecommendation}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Última actualización: {detail.lastUpdate}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[detail.status]}`}>
            {statusLabel[detail.status]}
          </span>
        </div>
      </div>
    </div>
  );
}
