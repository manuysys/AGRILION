'use client';

import { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Clock,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import type { SiloBag } from '@/types';
import { getSiloAiAnalysis, type SiloAiAnalysisData } from '@/lib/ai-api';
import { getCurrentIdToken } from '@/lib/auth-client';
import { getRiskBand } from '@/lib/thresholds';
import {
  formatCO2,
  formatHumidity,
  formatRelativeTime,
  formatTemp,
} from '@/lib/formatters';
import AnomalyBadge from '@/components/ui/anomaly-badge';

interface SiloAiAnalysisProps {
  silo: SiloBag;
  /** Modo demo: se arma un análisis de muestra a partir de los datos del silo. */
  demoMode?: boolean;
}

type Status = 'loading' | 'ok' | 'empty';

interface NormalizedStep {
  hours: number | null;
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
}

interface NormalizedAnalysis {
  timestamp: string | null;
  isDemo: boolean;
  steps: NormalizedStep[];
  lstmStatus: string | null;
  readings: number | null;
  required: number | null;
  isAnomaly: boolean | null;
  affectedSensors: string[];
  riskScore: number | null;
  riskLevel: string | null;
  riskFactors: string[];
  engine: string | null;
}

// ─── Normalización tolerante (el backend está en construcción) ───────────────

function toNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/** Acepta array (shape anidado) o string "temperature,co2" (shape plano). */
function toStringList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return toStringArray(value);
}

function normalizeSteps(raw: unknown): NormalizedStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { hours: null, temperature: null, humidity: null, co2: null };
    }
    const s = item as Record<string, unknown>;
    // `step` suele ser el índice del horizonte en horas; `hours_ahead` es explícito.
    const stepIndex = toNum(s.step);
    return {
      hours: toNum(s.hours_ahead) ?? stepIndex,
      temperature: toNum(s.temperature),
      humidity: toNum(s.humidity),
      co2: toNum(s.co2),
    };
  });
}

function normalizeAnalysis(data: SiloAiAnalysisData): NormalizedAnalysis {
  const latest = data.latest ?? null;

  // Shape anidado (lstm.steps) si existe; si no, shape plano persistido
  // (pred_*_1h → horizonte +1 h).
  const steps = data.lstm?.steps
    ? normalizeSteps(data.lstm.steps)
    : latest
      ? normalizeSteps([
          {
            hours_ahead: 1,
            temperature: latest.pred_temp_1h,
            humidity: latest.pred_hum_1h,
            co2: latest.pred_co2_1h,
          },
        ])
      : [];

  return {
    timestamp: data.timestamp ?? data.generated_at ?? latest?.timestamp ?? null,
    isDemo: data.source === 'demo',
    steps,
    lstmStatus: data.lstm?.status ?? latest?.engine ?? null,
    readings: toNum(data.lstm?.readings),
    required: toNum(data.lstm?.required),
    isAnomaly:
      typeof data.anomalies?.is_anomaly === 'boolean'
        ? data.anomalies.is_anomaly
        : typeof latest?.anomaly === 'boolean'
          ? latest.anomaly
          : null,
    affectedSensors:
      data.anomalies?.affected_sensors !== undefined
        ? toStringList(data.anomalies.affected_sensors)
        : toStringList(latest?.affected_sensors),
    riskScore: toNum(data.risk?.score) ?? toNum(latest?.risk_score),
    riskLevel:
      typeof data.risk?.level === 'string'
        ? data.risk.level
        : typeof latest?.risk_level === 'string'
          ? latest.risk_level
          : null,
    riskFactors: toStringArray(data.risk?.factors),
    engine: typeof latest?.engine === 'string' ? latest.engine : null,
  };
}

/** "lstm+consenso3+riesgo_compuesto" → etiqueta legible para la UI. */
function humanizeEngine(engine: string | null): string | null {
  if (!engine) return null;
  if (engine.includes('consenso3')) {
    return 'LSTM + Consenso de anomalías (3 métodos) + Riesgo compuesto';
  }
  if (engine.includes('lstm')) return 'LSTM + Riesgo compuesto';
  return engine;
}

/** Paso del LSTM más cercano a un horizonte objetivo (1 h / 6 h). */
function pickStep(steps: NormalizedStep[], targetHours: number): NormalizedStep | null {
  if (steps.length === 0) return null;
  const withHours = steps.filter((s) => s.hours !== null);
  // Tolerancia ±1.5 h: si solo hay +1 h, "+6 h" queda "Sin predicción"
  // en vez de mostrar el valor de 1 h engañoso.
  const near = withHours.filter((s) => Math.abs((s.hours ?? 0) - targetHours) <= 1.5);
  if (near.length === 0) return null;
  return near.reduce((best, s) =>
    Math.abs((s.hours ?? 0) - targetHours) < Math.abs((best.hours ?? 0) - targetHours)
      ? s
      : best
  );
}

// ─── Demo (mismo criterio que mock-data: datos claramente simulados) ─────────

function buildDemoAnalysis(silo: SiloBag): SiloAiAnalysisData {
  const reading = silo.currentReading;
  const riskLevel =
    silo.riskScore.band === 'danger'
      ? 'CRITICAL'
      : silo.riskScore.band === 'warning'
        ? 'WARNING'
        : 'NORMAL';

  return {
    silo_id: silo.id,
    timestamp: silo.sensor.lastSeen,
    source: 'demo',
    lstm: {
      status: 'ok',
      steps: [
        {
          hours_ahead: 1,
          temperature: reading.temperature + 0.2,
          humidity: reading.humidity - 0.1,
          co2: reading.co2 + 15,
        },
        {
          hours_ahead: 6,
          temperature: reading.temperature + 0.7,
          humidity: reading.humidity - 0.4,
          co2: reading.co2 + 60,
        },
      ],
    },
    anomalies: {
      is_anomaly: silo.state === 'critical',
      affected_sensors: silo.state === 'critical' ? ['temperature', 'co2'] : [],
    },
    risk: {
      score: silo.riskScore.value,
      level: riskLevel,
      factors: silo.interpretation.factors,
    },
  };
}

// ─── Presentación ────────────────────────────────────────────────────────────

function riskLevelStyle(level: string | null, score: number | null) {
  const band = score !== null ? getRiskBand(score) : null;
  const upper = level?.toUpperCase() ?? null;
  if (upper === 'CRITICAL' || band === 'danger') {
    return { label: 'Crítico', className: 'text-red-400 border-red-500/30 bg-red-500/10' };
  }
  if (upper === 'WARNING' || band === 'warning') {
    return { label: 'Atención', className: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
  }
  if (upper === 'NORMAL' || band === 'normal') {
    return { label: 'Estable', className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
  }
  if (level) return { label: level, className: 'text-zinc-300 border-white/10 bg-white/5' };
  return null;
}

function PredictionRow({
  horizon,
  step,
}: {
  horizon: string;
  step: NormalizedStep | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-semibold text-zinc-400 shrink-0">{horizon}</span>
      {step ? (
        <span className="font-data text-xs text-white text-right">
          {step.temperature !== null ? formatTemp(step.temperature) : 'T: —'} ·{' '}
          {step.humidity !== null ? formatHumidity(step.humidity) : 'H: —'} ·{' '}
          {step.co2 !== null ? formatCO2(step.co2) : 'CO₂: —'}
        </span>
      ) : (
        <span className="font-data text-xs text-zinc-600">Sin predicción</span>
      )}
    </div>
  );
}

export default function SiloAiAnalysis({ silo, demoMode = false }: SiloAiAnalysisProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [analysis, setAnalysis] = useState<NormalizedAnalysis | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (demoMode) {
        setAnalysis(normalizeAnalysis(buildDemoAnalysis(silo)));
        setStatus('ok');
        return;
      }

      setStatus('loading');
      try {
        const token = await getCurrentIdToken();
        const data = await getSiloAiAnalysis(silo.id, token);
        if (cancelled) return;
        if (data) {
          setAnalysis(normalizeAnalysis(data));
          setStatus('ok');
        } else {
          setAnalysis(null);
          setStatus('empty');
        }
      } catch {
        if (!cancelled) {
          setAnalysis(null);
          setStatus('empty');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [silo, demoMode]);

  const riskStyle = analysis ? riskLevelStyle(analysis.riskLevel, analysis.riskScore) : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 lg:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <BrainCircuit size={17} className="text-purple-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-white">Análisis IA</h3>
        {analysis?.timestamp && (
          <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-data ml-auto">
            <Clock size={12} aria-hidden="true" />
            Análisis {formatRelativeTime(analysis.timestamp)}
          </span>
        )}
        {analysis?.isDemo && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Demo
          </span>
        )}
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true" aria-label="Cargando análisis IA">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-zinc-900/60 p-5 relative overflow-hidden"
            >
              <div className="absolute inset-0 shimmer" aria-hidden="true" />
              <div className="relative z-10 space-y-3">
                <div className="h-4 w-28 bg-white/10 rounded-full" />
                <div className="h-8 w-24 bg-white/10 rounded-lg" />
                <div className="h-3 w-full bg-white/5 rounded-full" />
                <div className="h-3 w-2/3 bg-white/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'empty' && (
        <div className="p-8 rounded-xl border border-dashed border-white/10 bg-zinc-900/40 text-center">
          <BrainCircuit size={26} className="mx-auto text-zinc-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white">Análisis IA pendiente</p>
          <p className="mt-1 text-xs text-zinc-500">
            El análisis de IA aparecerá con la próxima lectura del sensor.
          </p>
        </div>
      )}

      {status === 'ok' && analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Motor 1: Predicción LSTM */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Predicción LSTM
              </p>
            </div>
            {analysis.lstmStatus === 'insufficient_data' ? (
              <p className="text-xs text-zinc-500">
                Recolectando datos:{' '}
                <span className="font-data text-zinc-300">
                  {analysis.readings ?? 0}/{analysis.required ?? '?'}
                </span>{' '}
                lecturas para poder predecir.
              </p>
            ) : (
              <div>
                <PredictionRow horizon="+1 h" step={pickStep(analysis.steps, 1)} />
                <PredictionRow horizon="+6 h" step={pickStep(analysis.steps, 6)} />
              </div>
            )}
            {analysis.engine && analysis.engine !== 'insufficient_data' && (
              <p className="mt-2 pt-2 border-t border-white/5 text-[10px] font-data text-zinc-600">
                {humanizeEngine(analysis.engine)}
              </p>
            )}
          </div>

          {/* Motor 2: Detección de anomalías */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TriangleAlert
                size={14}
                className={analysis.isAnomaly ? 'text-red-400' : 'text-emerald-400'}
                aria-hidden="true"
              />
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Anomalías
              </p>
            </div>
            {analysis.isAnomaly === null ? (
              <p className="text-xs text-zinc-500">Pendiente de datos suficientes.</p>
            ) : analysis.isAnomaly ? (
              <div>
                <p className="text-xs font-semibold text-red-400 mb-2">Anomalía detectada</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.affectedSensors.length > 0 ? (
                    analysis.affectedSensors.map((sensor) => (
                      <AnomalyBadge key={sensor} label={sensor} />
                    ))
                  ) : (
                    <AnomalyBadge label="Sensores fuera de patrón" />
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-400 font-medium">Sin anomalías detectadas</p>
            )}
          </div>

          {/* Motor 3: Motor de riesgo */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} className="text-emerald-400" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Motor de riesgo
              </p>
            </div>
            {analysis.riskScore !== null ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-data text-2xl font-black ${
                      analysis.riskScore >= 70
                        ? 'text-red-400'
                        : analysis.riskScore >= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {Math.round(analysis.riskScore)}
                  </span>
                  <span className="font-data text-xs text-zinc-500">/100</span>
                  {riskStyle && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskStyle.className}`}
                    >
                      {riskStyle.label}
                    </span>
                  )}
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      analysis.riskScore >= 70
                        ? 'bg-red-500'
                        : analysis.riskScore >= 30
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, analysis.riskScore))}%` }}
                  />
                </div>
                {analysis.riskFactors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {analysis.riskFactors.map((factor, i) => (
                      <AnomalyBadge key={`${factor}-${i}`} label={factor} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Sin evaluación de riesgo disponible.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
