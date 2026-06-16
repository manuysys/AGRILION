"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SiloBag } from "@/types";
import { fadeInUp } from "@/lib/motion";

const fieldColors: Record<string, string> = {
  "Campo 1": "from-emerald-50 to-green-50 border-emerald-200",
  "Campo 2": "from-amber-50 to-yellow-50 border-amber-200",
  "Campo 3": "from-sky-50 to-blue-50 border-sky-200",
};

const fieldPositions: Record<string, { x: number; y: number }> = {
  "Campo 1 - Zona Norte": { x: 50, y: 15 },
  "Campo 1 - Zona Central": { x: 50, y: 50 },
  "Campo 2 - Zona Este": { x: 85, y: 30 },
  "Campo 2 - Zona Oeste": { x: 15, y: 30 },
  "Campo 3 - Zona Sur": { x: 50, y: 85 },
};

function statusColor(status: string): string {
  if (status === "danger") return "fill-red-500 stroke-red-200";
  if (status === "warning") return "fill-yellow-500 stroke-yellow-200";
  return "fill-green-500 stroke-green-200";
}

interface Props {
  silobags: SiloBag[];
}

export default function SiloMap({ silobags }: Props) {
  const campos = ["Campo 1", "Campo 2", "Campo 3"];

  const stablePositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    silobags.forEach((bag) => {
      if (!fieldPositions[bag.location]) {
        const hash = bag.location.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        pos[bag.location] = {
          x: 30 + (hash % 40),
          y: 20 + ((hash * 7) % 60),
        };
      }
    });
    return pos;
  }, [silobags]);

  return (
    <motion.div
      className="grid md:grid-cols-3 gap-4"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
    >
      {campos.map((campo) => {
        const bags = silobags.filter((s) => s.location.startsWith(campo));
        if (bags.length === 0) return null;
        return (
          <motion.div
            key={campo}
            variants={fadeInUp}
            className={`rounded-2xl border p-4 bg-gradient-to-br ${fieldColors[campo] || "bg-gray-50 border-gray-200"}`}
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{campo}</h3>
            <div className="relative w-full aspect-square bg-white/60 rounded-xl border border-white/80">
              {bags.map((bag) => {
                const pos = fieldPositions[bag.location] || stablePositions[bag.location];
                return (
                  <div
                    key={bag.id}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" className="drop-shadow-sm">
                      <ellipse cx="12" cy="12" rx="10" ry="8" className={statusColor(bag.status)} />
                      <text x="12" y="14" textAnchor="middle" className="fill-white text-[8px] font-bold">
                        {bag.name.split(" ").pop()}
                      </text>
                    </svg>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5 whitespace-nowrap">
                      {bag.temperature}°C
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
