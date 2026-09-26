'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Lightbulb, TrendingUp, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import type { SiloBag, Alert } from '@/types';
import RiskGauge from '@/components/ui/risk-gauge';
import StatusPill from '@/components/ui/status-pill';
import { sendChatMessage, type ChatResponse } from '@/lib/ai-api';

interface IAClientProps {
  silos: SiloBag[];
  alerts: Alert[];
}

// ─── Local fallback responses (when AI API is not available) ─────────────────

function localFallbackResponse(query: string, silos: SiloBag[]): string {
  const q = query.toLowerCase();

  if (q.includes('riesgo') || q.includes('peligro') || q.includes('crítico')) {
    const critical = silos.filter((s) => s.state === 'critical');
    const warn = silos.filter((s) => s.state === 'warn');
    if (critical.length > 0 || warn.length > 0) {
      return `Actualmente hay ${critical.length} silo${critical.length !== 1 ? 's' : ''} en estado crítico (${critical.map(s => s.id).join(', ') || 'ninguno'}) y ${warn.length} en atención (${warn.map(s => s.id).join(', ') || 'ninguno'}). Recomiendo inspección inmediata para los silos críticos.`;
    }
    return 'No hay silos en estado de riesgo actualmente. Todos operan dentro de parámetros normales.';
  }

  if (q.includes('batería') || q.includes('battery')) {
    const lowBatt = silos.filter((s) => typeof s.sensor.battery === 'number' && s.sensor.battery < 50);
    if (lowBatt.length > 0) {
      return `Silos con batería baja: ${lowBatt.map(s => `${s.id} (${s.sensor.battery}%)`).join(', ')}. Recomiendo programar reemplazo de baterías en la próxima visita a campo.`;
    }
    return 'No hay datos de batería reportados por los sensores.';
  }

  if (q.includes('resumen') || q.includes('semana') || q.includes('general')) {
    const critical = silos.filter((s) => s.state === 'critical').length;
    const warn = silos.filter((s) => s.state === 'warn').length;
    const ok = silos.filter((s) => s.state === 'ok').length;
    return `Resumen del sistema: ${ok} silos estables, ${warn} en atención, ${critical} crítico${critical !== 1 ? 's' : ''}. Tendencia general: los parámetros se mantienen dentro de márgenes esperados para la época.`;
  }

  // Buscar silo específico en la query
  for (const silo of silos) {
    if (q.includes(silo.id.toLowerCase())) {
      return `${silo.id} "${silo.name}" presenta ${silo.interpretation.summary.toLowerCase()}. Score de riesgo: ${silo.riskScore.value}/100. ${silo.interpretation.recommendation}.`;
    }
  }

  return 'No tengo suficiente información para responder esa consulta específica. Probá con alguna de las sugerencias o preguntá sobre el estado de un silo específico.';
}

// ─── Typing Dots ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-xl bg-zinc-800/60 rounded-bl-md border border-zinc-700/50 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-zinc-500"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function IAClient({ silos, alerts }: IAClientProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null); // null = checking
  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedCommands = [
    '¿Qué silos están en riesgo?',
    'Resumen de la última semana',
    silos[0] ? `¿Cómo está el silo ${silos[0].id}?` : '¿Cómo está el sistema?',
    'Explicá las alertas activas',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ID de sesión generado en el cliente (no durante el render)
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `web-${Date.now()}`;
    }
  }, []);

  // Check if AI API is reachable on mount
  useEffect(() => {
    async function checkApi() {
      try {
        const res = await fetch('/api/ai/health');
        setApiConnected(res.ok);
      } catch {
        setApiConnected(false);
      }
    }
    checkApi();
  }, []);

  const handleSend = async (text?: string) => {
    const query = text ?? input;
    if (!query.trim()) return;

    const userMsg = { role: 'user' as const, text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Try the real AI API first
      if (apiConnected !== false) {
        const apiResponse: ChatResponse | null = await sendChatMessage(
          query,
          undefined, // silo_id (optional)
          sessionIdRef.current || 'web-dashboard'
        );

        if (apiResponse && apiResponse.response) {
          setIsTyping(false);
          setMessages((prev) => [...prev, { role: 'ai', text: apiResponse.response }]);
          return;
        }
      }

      // Fallback: local response with artificial delay
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));
      const fallbackText = localFallbackResponse(query, silos);
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: 'ai', text: fallbackText }]);
    } catch {
      // Final fallback
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        role: 'ai',
        text: localFallbackResponse(query, silos),
      }]);
    }
  };

  // Calculate system-wide stats
  const activeSilos = silos.filter(s => s.state !== 'offline');
  const avgRisk = activeSilos.length > 0
    ? Math.round(activeSilos.reduce((acc, s) => acc + s.riskScore.value, 0) / activeSilos.length)
    : 0;

  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Centro de Inteligencia Artificial
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Análisis predictivo, interpretación automática y asistente de consultas
          </p>
        </div>
        {/* API Status Indicator */}
        <div className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
          ${apiConnected === null
            ? 'bg-zinc-800 text-zinc-400'
            : apiConnected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }
        `}>
          {apiConnected === null ? (
            <>
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
              Verificando API...
            </>
          ) : apiConnected ? (
            <>
              <Wifi size={12} />
              AI API conectada
            </>
          ) : (
            <>
              <WifiOff size={12} />
              Modo local
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Analysis panels */}
        <div className="xl:col-span-2 space-y-6">
          {/* Risk overview */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Análisis Global de Riesgo
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {activeSilos.map((silo) => (
                <motion.div
                  key={silo.id}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="text-center p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <RiskGauge value={silo.riskScore.value} label={silo.riskScore.label} size="sm" />
                  <p className="text-xs font-medium text-white mt-2">{silo.id}</p>
                  <p className="text-[10px] text-zinc-500">{silo.name}</p>
                </motion.div>
              ))}
            </div>

            {/* Summary bar */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-zinc-500">
                Riesgo promedio: <span className="text-white font-medium">{avgRisk}/100</span>
              </span>
              <span className="text-zinc-500">
                Alertas activas: <span className="text-amber-400 font-medium">{activeAlerts.length}</span>
              </span>
            </div>
          </motion.div>

          {/* Interpretations */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={18} className="text-amber-400" />
              <h3 className="text-lg font-semibold text-white">
                Interpretaciones Activas
              </h3>
            </div>

            <div className="space-y-3">
              {silos.filter(s => s.state !== 'ok' && s.state !== 'offline').length === 0 && (
                <div className="text-center py-6 text-sm text-zinc-500">
                  <ShieldCheck size={24} className="text-emerald-500/60 mx-auto mb-2" />
                  Todos los silos operan normalmente
                </div>
              )}
              {silos.filter(s => s.state !== 'ok' && s.state !== 'offline').map((silo, i) => (
                <motion.div
                  key={silo.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <StatusPill state={silo.state} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {silo.id} — {silo.interpretation.summary}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {silo.interpretation.recommendation}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Chat */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col h-[calc(100vh-400px)] min-h-[500px] max-h-[700px] rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl overflow-hidden"
        >
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <BrainCircuit size={16} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Asistente IA
                </h3>
                <p className="text-[10px] text-zinc-500">
                  {apiConnected
                    ? 'Conectado al modelo de IA'
                    : apiConnected === false
                      ? 'Modo local (API no disponible)'
                      : 'Conectando...'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isTyping && (
              <div className="text-center py-6">
                <BrainCircuit size={32} className="text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-4">
                  Hacé una pregunta sobre tus silobolsas
                </p>
                <div className="space-y-2">
                  {suggestedCommands.map((cmd) => (
                    <motion.button
                      key={cmd}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend(cmd)}
                      className="
                        block w-full text-left px-3 py-2 rounded-lg
                        text-sm text-emerald-400
                        bg-zinc-800/50 hover:bg-zinc-700/60
                        transition-colors duration-150 cursor-pointer
                        border border-zinc-700/50
                      "
                    >
                      {cmd}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-emerald-700/90 text-white rounded-br-md'
                        : 'bg-zinc-800/60 text-zinc-100 rounded-bl-md border border-zinc-700/50'
                      }
                    `}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && <TypingDots />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Preguntá algo..."
                className="
                  flex-1 px-3 py-2 rounded-lg
                  border border-white/10 bg-white/5
                  text-sm text-white
                  placeholder:text-zinc-600
                  focus:border-emerald-500/50
                  outline-none transition-colors
                "
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="
                  p-2.5 rounded-lg bg-emerald-600
                  text-white hover:bg-emerald-500
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors duration-150 cursor-pointer
                "
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
