/**
 * AGRILION — AI API Client
 * ===========================
 *
 * Cliente HTTP TypeScript para comunicarse con la AI API de Python.
 * Todas las peticiones se proxifican a través de Next.js rewrites,
 * así que no hay problemas de CORS en el navegador.
 *
 * Las URLs usan /api/ai/* que se mapean a http://localhost:8000/api/v1/*
 * (configurado en next.config.ts).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SiloOverview {
  silo_id: string;
  temperature: number;
  humidity: number;
  co2: number;
  pressure?: number | null;
  risk_score: number;
  risk_level: 'NORMAL' | 'WARNING' | 'CRITICAL';
  last_update: string;
  grain_type?: string | null;
  device_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gps_fix?: boolean | null;
  gps_has_fix?: boolean | null;
  gps_satellites?: number | null;
  gps_hdop?: number | null;
  gps_age_min?: number | null;
}

export interface SiloHistoryPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
  pressure?: number | null;
}

export interface ChatRequest {
  message: string;
  silo_id?: string;
  session_id?: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  latency_ms: number;
  context_used: Record<string, unknown>;
  error?: string;
  from_cache: boolean;
}

export interface IngestRequest {
  silo_id: string;
  temperature: number;
  humidity: number;
  co2: number;
  timestamp?: string;
}

export interface IngestResponse {
  status: string;
  silo_id: string;
  timestamp: string;
  risk_score: number;
  risk_level: string;
  predictions: Record<string, number>;
  anomalies: Record<string, unknown>;
  alerts: Array<{ level: string; message: string }>;
  metadata: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  version: string;
  model_loaded: boolean;
  timestamp: string;
}

// ─── Base URL ────────────────────────────────────────────────────────────────
//
// En el navegador se usa el proxy de Next (`/api/ai/*` → rewrite a la AI API).
// En el servidor (SSR/build) las URLs relativas no son válidas: se llama
// directo a la AI API usando AI_API_URL (server-only, nunca llega al cliente).

const AI_PROXY_BASE = '/api/ai';
const AI_SERVER_BASE = `${process.env.AI_API_URL || 'http://localhost:8000'}/api/v1`;

function requestOptions(timeoutMs = 8000, token?: string | null): RequestInit {
  return {
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
}

function apiUrl(path: string): string {
  if (typeof window === 'undefined') {
    return `${AI_SERVER_BASE}${path}`;
  }
  return `${AI_PROXY_BASE}${path}`;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Health check de la AI API.
 */
export async function checkHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(apiUrl('/health'), requestOptions(4000));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Obtener overview de todos los silos (datos reales desde InfluxDB).
 */
export async function getSilosOverview(token?: string | null): Promise<SiloOverview[]> {
  try {
    const res = await fetch(apiUrl('/silos/overview'), requestOptions(8000, token));
    if (!res.ok) {
      console.warn(`AI API overview failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.silos || [];
  } catch (e) {
    console.warn('AI API overview error:', e);
    return [];
  }
}

/**
 * Obtener historial de un silo específico.
 */
export async function getSiloHistory(
  siloId: string,
  hours: number = 24,
  token?: string | null
): Promise<SiloHistoryPoint[]> {
  try {
    const res = await fetch(
      apiUrl(`/silos/${siloId}/history?hours=${hours}`),
      requestOptions(8000, token)
    );
    if (!res.ok) {
      console.warn(`AI API history failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.history || [];
  } catch (e) {
    console.warn('AI API history error:', e);
    return [];
  }
}

/**
 * Obtener estado actual de un silo.
 */
export async function getSiloCurrent(
  siloId: string,
  token?: string | null
): Promise<SiloOverview | null> {
  try {
    const res = await fetch(
      apiUrl(`/silos/${siloId}/current`),
      requestOptions(8000, token)
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── AI Analysis (por silo) ──────────────────────────────────────────────────

/**
 * Un paso de la predicción LSTM (p. ej. horizonte +1 h o +6 h).
 */
export interface SiloAiAnalysisStep {
  step?: number;
  hours_ahead?: number | null;
  timestamp?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  co2?: number | null;
}

/**
 * Punto plano persistido por el pipeline en la medición `ai_analisis`
 * (InfluxDB). Es el shape actual real del endpoint `/silos/{id}/ai-analysis`.
 */
export interface SiloAiAnalysisLatestPoint {
  timestamp?: string | null;
  risk_score?: number | null;
  risk_level?: string | null;
  anomaly?: boolean | null;
  /** String separado por comas, p. ej. "temperature,co2". */
  affected_sensors?: string | null;
  pred_temp_1h?: number | null;
  pred_hum_1h?: number | null;
  pred_co2_1h?: number | null;
  engine?: string | null;
}

/**
 * Salida del endpoint de análisis IA por silo (`/silos/{id}/ai-analysis`).
 * Acepta el shape plano persistido (`latest`) y un shape anidado más rico
 * (`lstm.steps` + `risk`) para cuando el backend publique horizontes extra.
 * El frontend degrada con elegancia cuando algo falta.
 */
export interface SiloAiAnalysisData {
  silo_id?: string;
  timestamp?: string | null; // momento en que se generó el análisis
  generated_at?: string | null;
  source?: string | null; // p. ej. "demo"
  latest?: SiloAiAnalysisLatestPoint | null;
  lstm?: {
    status?: string; // 'ok' | 'insufficient_data'
    readings?: number | null;
    required?: number | null;
    steps?: SiloAiAnalysisStep[];
  } | null;
  anomalies?: {
    is_anomaly?: boolean | null;
    affected_sensors?: string[];
  } | null;
  risk?: {
    score?: number | null;
    level?: string | null;
    factors?: string[];
  } | null;
}

/**
 * Análisis IA de un silo: predicción LSTM, detección de anomalías y motor de
 * riesgo. Devuelve null si la AI API no responde (el endpoint puede aún no
 * existir): la UI muestra un estado vacío en ese caso.
 */
export async function getSiloAiAnalysis(
  siloId: string,
  token?: string | null
): Promise<SiloAiAnalysisData | null> {
  try {
    const res = await fetch(
      apiUrl(`/silos/${encodeURIComponent(siloId)}/ai-analysis`),
      requestOptions(8000, token)
    );
    if (!res.ok) {
      console.warn(`AI API ai-analysis failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as SiloAiAnalysisData;
  } catch (e) {
    console.warn('AI API ai-analysis error:', e);
    return null;
  }
}

/**
 * Enviar mensaje al chatbot de IA.
 *
 * @param message - Pregunta del usuario
 * @param siloId - (Opcional) ID del silo para contexto
 * @param sessionId - (Opcional) ID de sesión para mantener conversación
 */
export async function sendChatMessage(
  message: string,
  siloId?: string,
  sessionId?: string,
  token?: string | null
): Promise<ChatResponse | null> {
  try {
    const payload: Record<string, string> = {
      message,
      session_id: sessionId || 'web-dashboard',
    };
    // Solo se envía silo_id si el usuario eligió uno (evita contexto falso)
    if (siloId) payload.silo_id = siloId;

    const res = await fetch(apiUrl('/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`AI chat API failed: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (e) {
    console.warn('AI chat API error:', e);
    return null;
  }
}

/**
 * Generar resumen natural de un silo.
 */
export async function summarizeSilo(
  siloId: string,
  token?: string | null
): Promise<ChatResponse | null> {
  try {
    const res = await fetch(apiUrl(`/chat/summarize/${siloId}`), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Enviar una lectura de sensor a la AI API para análisis en tiempo real.
 * (Normalmente usado por el backend, no por el frontend.)
 */
export async function ingestReading(
  reading: IngestRequest
): Promise<IngestResponse | null> {
  try {
    // Usar proxy server-side para no exponer la ingest key en el cliente
    const res = await fetch('/api/ai/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Limpiar sesión de chat.
 */
export async function clearChatSession(
  sessionId: string,
  token?: string | null
): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/chat/session/${sessionId}`), {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.ok;
  } catch {
    return false;
  }
}
