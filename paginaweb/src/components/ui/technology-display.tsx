"use client";

import React from "react";
import DisplayCards from "@/components/ui/display-cards";
import { Activity, ShieldAlert, Cloud } from "lucide-react";

export function TechnologyDisplay() {
  const cards = [
    {
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      title: "Sensores IoT",
      description: "Medición quirúrgica en tiempo real.",
      date: "",
      iconClassName: "text-emerald-500",
      titleClassName: "text-emerald-400",
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      title: "IA Predictiva",
      description: "Modelos ML que previenen daños.",
      date: "",
      iconClassName: "text-rose-500",
      titleClassName: "text-rose-400",
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Cloud className="w-5 h-5 text-blue-400" />,
      title: "Cloud Platform",
      description: "SaaS robusto y 100% escalable.",
      date: "",
      iconClassName: "text-blue-500",
      titleClassName: "text-blue-400",
      className:
        "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
  ];

  return (
    <section className="py-32 relative bg-[#020617] flex flex-col items-center justify-center border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-16 relative z-10">
        <div className="flex-1 space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
            TECNOLOGÍA <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              DE PUNTA.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-md leading-relaxed">
            Hemos construido el stack tecnológico más avanzado del agro. Desde sensores modulares con conectividad LoRaWAN hasta modelos de Machine Learning entrenados con millones de data points.
          </p>
        </div>
        
        <div className="flex-1 flex justify-center items-center py-20">
          <DisplayCards cards={cards} />
        </div>
      </div>
    </section>
  );
}
