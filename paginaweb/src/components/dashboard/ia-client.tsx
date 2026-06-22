'use client';

import { useState } from 'react';
import { BrainCircuit, Send, Lightbulb, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { SiloBag, Alert } from '@/types';
import RiskGauge from '@/components/ui/risk-gauge';
import StatusPill from '@/components/ui/status-pill';

interface IAClientProps {
  silos: SiloBag[];
  alerts: Alert[];
}

const suggestedCommands = [
  '¿Qué silos están en riesgo?',
  'Resumen de la última semana',
  '¿Qué silos tienen batería baja?',
  'Explicá la alerta de SB-005',
];

// Mock chat responses
function generateResponse(query: string, silos: SiloBag[]): string {
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
    const lowBatt = silos.filter((s) => s.sensor.battery < 50);
    if (lowBatt.length > 0) {
      return `Silos con batería baja: ${lowBatt.map(s => `${s.id} (${s.sensor.battery}%)`).join(', ')}. Recomiendo programar reemplazo de baterías en la próxima visita a campo.`;
    }
    return 'Todas las baterías están en niveles aceptables (>50%).';
  }

  if (q.includes('sb-005') || q.includes('lote sur')) {
    const silo = silos.find((s) => s.id === 'SB-005');
    if (silo) {
      return `${silo.id} "${silo.name}" presenta ${silo.interpretation.summary.toLowerCase()}. Score de riesgo: ${silo.riskScore.value}/100. ${silo.interpretation.recommendation}.`;
    }
  }

  if (q.includes('resumen') || q.includes('semana') || q.includes('general')) {
    const critical = silos.filter((s) => s.state === 'critical').length;
    const warn = silos.filter((s) => s.state === 'warn').length;
    const ok = silos.filter((s) => s.state === 'ok').length;
    return `Resumen del sistema: ${ok} silos estables, ${warn} en atención, ${critical} crítico${critical !== 1 ? 's' : ''}. Tendencia general: los parámetros se mantienen dentro de márgenes esperados para la época, excepto ${silos.find(s => s.state === 'critical')?.name ?? 'N/A'} que requiere intervención.`;
  }

  return 'No tengo suficiente información para responder esa consulta específica. Probá con alguna de las sugerencias o preguntá sobre el estado de un silo específico.';
}

export default function IAClient({ silos, alerts }: IAClientProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = (text?: string) => {
    const query = text ?? input;
    if (!query.trim()) return;

    const userMsg = { role: 'user' as const, text: query };
    const aiResponse = { role: 'ai' as const, text: generateResponse(query, silos) };

    setMessages((prev) => [...prev, userMsg, aiResponse]);
    setInput('');
  };

  // Calculate system-wide stats
  const avgRisk = Math.round(
    silos.filter(s => s.state !== 'offline').reduce((acc, s) => acc + s.riskScore.value, 0) /
    silos.filter(s => s.state !== 'offline').length
  );

  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">
          Centro de Inteligencia Artificial
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Análisis predictivo, interpretación automática y asistente de consultas
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Analysis panels */}
        <div className="xl:col-span-2 space-y-6">
          {/* Risk overview */}
          <div className="bg-white rounded-xl border border-[var(--border-default)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-purple-600" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Análisis Global de Riesgo
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {silos.filter(s => s.state !== 'offline').map((silo) => (
                <div key={silo.id} className="text-center">
                  <RiskGauge value={silo.riskScore.value} label={silo.riskScore.label} size="sm" />
                  <p className="text-xs font-medium text-[var(--text-primary)] mt-2">{silo.id}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{silo.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretations */}
          <div className="bg-white rounded-xl border border-[var(--border-default)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={18} className="text-amber-500" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Interpretaciones Activas
              </h3>
            </div>

            <div className="space-y-3">
              {silos.filter(s => s.state !== 'ok').map((silo) => (
                <div
                  key={silo.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-1)]"
                >
                  <StatusPill state={silo.state} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {silo.id} — {silo.interpretation.summary}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {silo.interpretation.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex flex-col h-[600px] bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-1)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100">
                <BrainCircuit size={16} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Asistente IA
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Preguntá sobre el estado de tus silobolsas
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <BrainCircuit size={32} className="text-purple-200 mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Hacé una pregunta sobre tus silobolsas
                </p>
                <div className="space-y-2">
                  {suggestedCommands.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleSend(cmd)}
                      className="
                        block w-full text-left px-3 py-2 rounded-lg
                        text-sm text-[var(--brand-accent)]
                        bg-blue-50 hover:bg-blue-100
                        transition-colors duration-150 cursor-pointer
                      "
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-[var(--brand-primary)] text-white rounded-br-md'
                      : 'bg-[var(--surface-1)] text-[var(--text-primary)] rounded-bl-md'
                    }
                  `}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--border-default)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Preguntá algo..."
                className="
                  flex-1 px-3 py-2 rounded-lg
                  border border-[var(--border-default)] bg-[var(--surface-1)]
                  text-sm text-[var(--text-primary)]
                  placeholder:text-[var(--text-muted)]
                  focus:border-[var(--brand-accent)]
                  outline-none transition-colors
                "
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="
                  p-2.5 rounded-lg bg-[var(--brand-primary)]
                  text-white hover:bg-[var(--brand-primary-light)]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors duration-150 cursor-pointer
                "
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
