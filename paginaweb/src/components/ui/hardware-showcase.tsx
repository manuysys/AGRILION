'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Battery, Radio, Server, Activity } from 'lucide-react';

export function HardwareShowcase() {
  return (
    <section className="relative py-32 bg-zinc-950 border-t border-white/5 z-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[3rem] md:text-[5rem] font-bold tracking-tighter leading-none mb-6"
          >
            INGENIERÍA <span className="text-emerald-500">INDUSTRIAL.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-400 font-light max-w-2xl mx-auto"
          >
            Hardware robusto diseñado para soportar las condiciones del campo. Batería de ultra larga duración y comunicación de largo alcance.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Hardware Image with Hotspots */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="flex-1 relative w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass-dark border border-white/10"
          >
            <Image 
              src="/images/sensor-device.png"
              alt="Agrilion CubeCell Lora Sensor"
              fill
              className="object-contain p-8 drop-shadow-2xl"
            />
            {/* Hotspots */}
            <div className="absolute top-[20%] left-[40%] flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
              <div className="w-4 h-4 rounded-full bg-emerald-500 relative z-10 border-2 border-white" />
              <span className="glass-dark px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap border border-white/10">Antena LoRa</span>
            </div>
            
            <div className="absolute bottom-[30%] right-[30%] flex items-center gap-4">
              <span className="glass-dark px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap border border-white/10">Sensores T/H/CO2</span>
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                <div className="w-4 h-4 rounded-full bg-emerald-500 relative z-10 border-2 border-white" />
              </div>
            </div>
          </motion.div>

          {/* Specs Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-dark p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              <Radio className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-bold mb-2">LoRaWAN</h3>
              <p className="text-zinc-400 font-light text-sm">Comunicación de largo alcance (kilómetros) sin necesidad de WiFi o 4G en el silo.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-dark p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              <Battery className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-bold mb-2">6-12 Meses</h3>
              <p className="text-zinc-400 font-light text-sm">Batería optimizada para cubrir toda la campaña agrícola sin necesidad de recargas.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-dark p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              <Activity className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-bold mb-2">Lectura Continua</h3>
              <p className="text-zinc-400 font-light text-sm">Transmisión de datos cada 1-2 horas para generar alertas tempranas confiables.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="glass-dark p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              <Server className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-bold mb-2">Cloud + IA</h3>
              <p className="text-zinc-400 font-light text-sm">Integración directa con nuestro backend Firebase y modelos predictivos de riesgo.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
