"use client";

import { useState } from "react";
import { Bell, Filter, CheckCheck, AlertTriangle, Droplets, Thermometer, Battery, Wind } from "lucide-react";
import { Alert } from "@/types";

interface Props {
  alerts: Alert[];
  onSelectBag: (id: string) => void;
}

const severityBg: Record<string, string> = {
  info: "bg-blue-50 border-blue-100",
  warning: "bg-yellow-50 border-yellow-100",
  critical: "bg-red-50 border-red-100",
};

const severityLabel: Record<string, string> = {
  info: "Info",
  warning: "Advertencia",
  critical: "Crítica",
};
const severityText: Record<string, string> = {
  info: "text-blue-600 bg-blue-50",
  warning: "text-yellow-600 bg-yellow-50",
  critical: "text-red-600 bg-red-50",
};

const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  humedad: Droplets,
  temperatura: Thermometer,
  condensacion: Wind,
  deterioro: AlertTriangle,
  bateria: Battery,
};

export default function AlertPanel({ alerts, onSelectBag }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [readState, setReadState] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("alertReadState") || "{}");
    } catch { return {}; }
  });

  const toggleRead = (id: string) => {
    setReadState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("alertReadState", JSON.stringify(next));
      return next;
    });
  };

  const filtered = alerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "unread") return !(readState[a.id] ?? a.read);
    return a.severity === filter;
  });

  const unreadCount = alerts.filter((a) => !(readState[a.id] ?? a.read)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
        <span className="text-sm text-gray-500">
          {unreadCount} sin leer
        </span>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {[
          { value: "all", label: "Todas" },
          { value: "unread", label: "Sin leer" },
          { value: "critical", label: "Críticas" },
          { value: "warning", label: "Advertencias" },
          { value: "info", label: "Información" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === opt.value
                ? "bg-[#1a5c3a] text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-green-400" />
          </div>
          <p className="text-gray-500 font-medium">No hay alertas</p>
          <p className="text-sm text-gray-400 mt-1">
            Todas las alertas han sido revisadas
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const Icon = typeIcons[alert.type] || AlertTriangle;
            const isRead = readState[alert.id] ?? alert.read;

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border-2 p-4 transition-all hover:shadow-md cursor-pointer ${
                  isRead
                    ? "bg-white border-gray-100 opacity-70"
                    : `${severityBg[alert.severity]} border-transparent`
                }`}
                onClick={() => onSelectBag(alert.siloBagId)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    alert.severity === "critical"
                      ? "bg-red-100"
                      : alert.severity === "warning"
                      ? "bg-yellow-100"
                      : "bg-blue-100"
                  }`}>
                    <Icon size={18} className={
                      alert.severity === "critical"
                        ? "text-red-500"
                        : alert.severity === "warning"
                        ? "text-yellow-500"
                        : "text-blue-500"
                    } />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {alert.siloBagName}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityText[alert.severity]}`}>
                        {severityLabel[alert.severity]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.timestamp}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRead(alert.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isRead
                        ? "text-gray-300 hover:text-gray-500"
                        : "text-[#1a5c3a] hover:bg-[#1a5c3a]/10"
                    }`}
                    title={isRead ? "Marcar no leída" : "Marcar leída"}
                  >
                    <CheckCheck size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
