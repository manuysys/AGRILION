"use client";

import { motion } from "framer-motion";
import { Search, Filter, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { SiloBag } from "@/types";
import { fadeInUp, staggerContainer } from "@/lib/motion";

interface Props {
  silobags: SiloBag[];
}

const statusColors: Record<string, string> = {
  normal: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
};
const statusBg: Record<string, string> = {
  normal: "bg-green-50 text-green-600",
  warning: "bg-yellow-50 text-yellow-600",
  danger: "bg-red-50 text-red-600",
};
const statusLabel: Record<string, string> = {
  normal: "Normal",
  warning: "Advertencia",
  danger: "Riesgo",
};
const riskColors: Record<string, string> = {
  bajo: "text-green-600 bg-green-50",
  medio: "text-yellow-600 bg-yellow-50",
  alto: "text-red-600 bg-red-50",
};

export default function SiloBagList({ silobags }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = silobags.filter((bag) => {
    const matchesSearch =
      bag.name.toLowerCase().includes(search.toLowerCase()) ||
      bag.location.toLowerCase().includes(search.toLowerCase()) ||
      bag.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || bag.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Silobolsas</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ubicación o ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 focus:border-[#1a5c3a] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          {[
            { value: "all", label: "Todos" },
            { value: "normal", label: "Normal" },
            { value: "warning", label: "Advertencia" },
            { value: "danger", label: "Riesgo" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterStatus === opt.value
                  ? "bg-[#1a5c3a] text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No se encontraron silobolsas</p>
          <p className="text-sm text-gray-400 mt-1">Intente con otros filtros</p>
        </div>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((bag, i) => (
            <motion.div key={bag.id} variants={fadeInUp} custom={i}>
            <Link
              href={`/dashboard/silo/${bag.id}`}
              className="block bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl hover:border-[#1a5c3a]/20 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${statusColors[bag.status]}`}
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    {bag.name}
                  </span>
                </div>
                <span className={`flex items-center gap-1 text-xs ${
                  bag.sensorOnline ? "text-green-500" : "text-red-400"
                }`}>
                  {bag.sensorOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-4">{bag.location}</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Temp</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {bag.temperature}°C
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Humedad</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {bag.humidity}%
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Batería</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {bag.battery}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBg[bag.status]}`}
                >
                  {statusLabel[bag.status]}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskColors[bag.risk]}`}
                >
                  Riesgo {bag.risk}
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Última actualización: {bag.lastUpdate}
              </p>
            </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
