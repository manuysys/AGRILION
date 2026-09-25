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
  risk_score: number;
  risk_level: 'NORMAL' | 'WARNING' | 'CRITICAL';
  last_update: string;
}

export interface SiloHistoryPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
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

const AI_BASE = '/api/ai';

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Health check de la AI API.
 */
export async function checkHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${AI_BASE}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Obtener overview de todos los silos (datos reales desde InfluxDB).
 */
export async function getSilosOverview(): Promise<SiloOverview[]> {
  try {
    const res = await fetch(`${AI_BASE}/silos/overview`);
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
  hours: number = 24
): Promise<SiloHistoryPoint[]> {
  try {
    const res = await fetch(`${AI_BASE}/silos/${siloId}/history?hours=${hours}`);
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
  siloId: string
): Promise<SiloOverview | null> {
  try {
    const res = await fetch(`${AI_BASE}/silos/${siloId}/current`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
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
  sessionId?: string
): Promise<ChatResponse | null> {
  try {
    const res = await fetch(`${AI_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        silo_id: siloId || 'SILO_001',
        session_id: sessionId || 'web-dashboard',
      }),
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
  siloId: string
): Promise<ChatResponse | null> {
  try {
    const res = await fetch(`${AI_BASE}/chat/summarize/${siloId}`, {
      method: 'POST',
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
    const res = await fetch(`${AI_BASE}/ingest`, {
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
  sessionId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${AI_BASE}/chat/session/${sessionId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
