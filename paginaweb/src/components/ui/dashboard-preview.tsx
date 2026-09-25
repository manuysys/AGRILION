"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ShieldCheck, Activity, Droplets, Wind, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

const mockData = [
  { time: "00:00", temp: 21.0, hum: 18.2, co2: 410 },
  { time: "04:00", temp: 20.5, hum: 18.5, co2: 450 },
  { time: "08:00", temp: 23.0, hum: 19.0, co2: 520 },
  { time: "12:00", temp: 27.5, hum: 17.2, co2: 680 },
  { time: "16:00", temp: 26.0, hum: 17.5, co2: 590 },
  { time: "20:00", temp: 23.5, hum: 18.0, co2: 480 },
  { time: "24:00", temp: 22.1, hum: 18.2, co2: 425 },
];

export function DashboardPreview() {
  const [activeData, setActiveData] = useState(mockData);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveData((prev) => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        newData.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: last.temp + (Math.random() - 0.5) * 0.5,
          hum: last.hum + (Math.random() - 0.5) * 0.2,
          co2: last.co2 + (Math.random() - 0.5) * 20,
        });
        if (newData.length > 8) newData.shift();
        return newData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0a0a] text-white p-6 md:p-8 font-sans overflow-hidden flex flex-col relative rounded-2xl">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-50">Silobolsa Lote #4</h2>
          <p className="text-emerald-500/80 text-sm font-medium mt-1 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            CONECTADA - TRANSMITIENDO
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">Estado Óptimo</span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
        <KpiCard title="Temperatura" value={`${activeData[activeData.length - 1].temp.toFixed(1)}°C`} icon={<Activity className="text-rose-400" />} trend="+0.2°" status="normal" />
        <KpiCard title="Humedad" value={`${activeData[activeData.length - 1].hum.toFixed(1)}%`} icon={<Droplets className="text-blue-400" />} trend="-0.1%" status="normal" />
        <KpiCard title="CO₂" value={`${Math.floor(activeData[activeData.length - 1].co2)} ppm`} icon={<Wind className="text-amber-400" />} trend="+12 ppm" status="warning" />
      </div>

      {/* Chart Section */}
      <div className="flex-1 min-h-[250px] bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/50 p-4 md:p-6 relative z-10 flex flex-col">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-300">
          <Activity className="w-4 h-4 text-emerald-500" /> Evolución 24hs
        </h3>
        <div className="flex-1 w-full h-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="time" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="temp" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, trend, status }: { title: string, value: string, icon: React.ReactNode, trend: string, status: 'normal' | 'warning' }) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/50 p-5 flex flex-col relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-black/50 rounded-lg border border-white/5">
          {icon}
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-zinc-400 font-medium text-sm mb-1">{title}</h4>
        <div className="text-3xl font-bold tracking-tight font-mono">{value}</div>
      </div>
    </motion.div>
  );
}
