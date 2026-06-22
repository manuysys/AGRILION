'use client';

import React, { useEffect, useRef } from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Meteors } from "@/components/ui/meteors";
import { Activity, ShieldAlert, Cpu, Wifi } from "lucide-react";
import gsap from "gsap";
import { useInView } from "framer-motion";

export function FeaturesBento() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let ctx = gsap.context(() => {
        // Initialize hidden state
        gsap.set(".bento-item", { y: 100, opacity: 0 });
        
        // Animate
        gsap.to(".bento-item", {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        });
      }, containerRef);
      return () => ctx.revert();
    } else {
      // Set initial state before view
      let ctx = gsap.context(() => {
        gsap.set(".bento-item", { y: 100, opacity: 0 });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [isInView]);

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 w-full py-20 relative z-20">
      <div className="mb-12">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
          CARACTERÍSTICAS <span className="text-emerald-500">PRO.</span>
        </h2>
        <p className="text-zinc-400 mt-4 text-lg">
          Un panel de control diseñado para la toma de decisiones críticas.
        </p>
      </div>

      <BentoGrid className="max-w-7xl mx-auto">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            icon={item.icon}
            className={i === 0 || i === 3 ? "md:col-span-2 bento-item" : "bento-item"}
          />
        ))}
      </BentoGrid>
    </div>
  );
}

const Skeleton = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const items = [
  {
    title: "Monitoreo en Tiempo Real",
    description: "Conoce el estado exacto de cada silobolsa en milisegundos con latencia ultra-baja y R3F visualizers.",
    header: (
      <Skeleton className="bg-gradient-to-br from-emerald-900 to-black">
        <Meteors number={20} />
      </Skeleton>
    ),
    icon: <Activity className="h-6 w-6 text-emerald-500" />,
  },
  {
    title: "Alertas Predictivas IA",
    description: "No esperes a que el grano se arruine. Modelos de Machine Learning te avisan días antes.",
    header: <Skeleton className="bg-zinc-900 flex items-center justify-center border border-white/5"><ShieldAlert size={48} className="text-red-500/20" /></Skeleton>,
    icon: <ShieldAlert className="h-6 w-6 text-red-500" />,
  },
  {
    title: "Batería de Larga Duración",
    description: "Hardware de bajo consumo garantizado para durar más de 2 años sin reemplazo.",
    header: <Skeleton className="bg-zinc-900 flex items-center justify-center border border-white/5"><Cpu size={48} className="text-amber-500/20" /></Skeleton>,
    icon: <Cpu className="h-6 w-6 text-amber-500" />,
  },
  {
    title: "Conectividad LoRaWAN",
    description:
      "Cobertura en el medio de la nada. Transmisión segura hasta a 15 kilómetros de la base central.",
    header: (
      <Skeleton className="bg-gradient-to-br from-blue-900/50 to-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586771107584-568c569f1a23?q=80&w=1000')] opacity-20 mix-blend-overlay object-cover" />
      </Skeleton>
    ),
    icon: <Wifi className="h-6 w-6 text-blue-500" />,
  },
];
