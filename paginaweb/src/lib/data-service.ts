// Data service layer — abstracts mock vs API data sources
//
// When MOCK_MODE=true (default), returns hardcoded mock data.
// When MOCK_MODE=false, calls the Python AI API via Next.js rewrites.
// If the API is unreachable, gracefully falls back to mock data.

import type { SiloBag, Alert, DashboardStats } from '@/types';
import { mockSiloBags, mockAlerts, mockDashboardStats } from './mock-data';
import { getRiskBand } from './thresholds';
import {
  getSilosOverview,
  getSiloHistory,
  type SiloOverview,
} from './ai-api';

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskLevelToState(level: string): 'ok' | 'warn' | 'critical' {
  if (level === 'CRITICAL') return 'critical';
  if (level === 'WARNING') return 'warn';
  return 'ok';
}

function riskScoreToLabel(score: number): string {
  const band = getRiskBand(score);
  if (band === 'danger') return 'Crítico';
  if (band === 'warning') return 'Atención';
  return 'Estable';
}

function riskScoreToBand(score: number): 'normal' | 'warning' | 'danger' {
  return getRiskBand(score);
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Mapear un SiloOverview de la API a un SiloBag del frontend.
 *
 * Solo se usan datos reales: lo que la API no provee queda como "sin dato"
 * (no se inventan ubicación, batería, toneladas ni fechas).
 */
function overviewToSiloBag(o: SiloOverview): SiloBag {
  const state = riskLevelToState(o.risk_level);
  const now = new Date().toISOString();

  return {
    id: o.silo_id,
    name: `Silobolsa ${o.silo_id.replace('SILO_', 'SB-')}`,
    location: 'Sin ubicación',
    grainType: o.grain_type ? capitalize(o.grain_type) : 'Sin dato',
    state,
    riskScore: {
      value: o.risk_score,
      band: riskScoreToBand(o.risk_score),
      label: riskScoreToLabel(o.risk_score),
      trend: 'stable',
    },
    currentReading: {
      timestamp: o.last_update || now,
      temperature: o.temperature,
      humidity: o.humidity,
      co2: o.co2,
    },
    sensor: {
      connection: 'online',
      battery: null,
      lastSeen: o.last_update || now,
      signalStrength: null,
    },
    interpretation: {
      summary: state === 'ok'
        ? 'Parámetros dentro de rangos normales'
        : state === 'warn'
          ? 'Condiciones requieren monitoreo'
          : 'Riesgo detectado — requiere intervención',
      recommendation: state === 'critical'
        ? 'Inspección inmediata recomendada'
        : state === 'warn'
          ? 'Revisar en próximas 24 horas'
          : 'Sin acción requerida',
      confidence: null,
      factors: [],
    },
    readings24h: [],
    alerts: [],
    storedSince: null,
    estimatedTons: null,
  };
}

const EMPTY_STATS: DashboardStats = {
  totalSilos: 0,
  activeSensors: 0,
  totalSensors: 0,
  activeAlerts: 0,
  criticalAlerts: 0,
  averageBattery: 0,
  lastGlobalUpdate: new Date().toISOString(),
  systemHealth: 'ok',
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (MOCK_MODE) return mockDashboardStats;

  try {
    const silos = await fetchSilobags();
    const alerts = await fetchAlerts();
    const activeAlerts = alerts.filter(a => !a.acknowledged);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');

    const totalSilos = silos.length;
    const onlineSilos = silos.filter(s => s.sensor.connection === 'online').length;
    const batteries = silos
      .map(s => s.sensor.battery)
      .filter((b): b is number => typeof b === 'number');
    const avgBattery = batteries.length > 0
      ? Math.round(batteries.reduce((acc, b) => acc + b, 0) / batteries.length)
      : 0;

    const criticalCount = silos.filter(s => s.state === 'critical').length;
    const warnCount = silos.filter(s => s.state === 'warn').length;

    let systemHealth: 'ok' | 'warn' | 'critical' = 'ok';
    if (criticalCount > 0) systemHealth = 'critical';
    else if (warnCount > 0) systemHealth = 'warn';

    return {
      totalSilos,
      activeSensors: onlineSilos,
      totalSensors: totalSilos,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      averageBattery: avgBattery,
      lastGlobalUpdate: new Date().toISOString(),
      systemHealth,
    };
  } catch {
    // En modo real no se inventan datos: se devuelve el estado vacío.
    return EMPTY_STATS;
  }
}

// ── Silo Bags ──
export async function fetchSilobags(): Promise<SiloBag[]> {
  if (MOCK_MODE) {
    // Sort by risk score (descending) for ranking
    return [...mockSiloBags].sort((a, b) => b.riskScore.value - a.riskScore.value);
  }

  // Modo real: si la API falla o no hay datos, se devuelve vacío (sin mock).
  const overview = await getSilosOverview();
  const silos = overview.map(overviewToSiloBag);
  return silos.sort((a, b) => b.riskScore.value - a.riskScore.value);
}

// ── Single Silo Detail ──
export async function fetchSiloDetail(id: string): Promise<SiloBag | null> {
  if (MOCK_MODE) {
    return mockSiloBags.find((s) => s.id === id) ?? null;
  }

  try {
    // Primero obtener el overview para encontrar este silo
    const overview = await getSilosOverview();
    const siloOverview = overview.find(s => s.silo_id === id);

    if (!siloOverview) {
      return null;
    }

    const siloBag = overviewToSiloBag(siloOverview);

    // Cargar historial de 24h
    const history = await getSiloHistory(id, 24);
    if (history.length > 0) {
      siloBag.readings24h = history.map(h => ({
        timestamp: h.timestamp,
        temperature: h.temperature,
        humidity: h.humidity,
        co2: h.co2,
      }));
    }

    return siloBag;
  } catch {
    return null;
  }
}

// ── Alerts ──
export async function fetchAlerts(filter?: {
  severity?: string;
  siloId?: string;
  acknowledged?: boolean;
}): Promise<Alert[]> {
  if (MOCK_MODE) {
    let alerts = [...mockAlerts];

    if (filter?.severity) {
      alerts = alerts.filter((a) => a.severity === filter.severity);
    }
    if (filter?.siloId) {
      alerts = alerts.filter((a) => a.siloId === filter.siloId);
    }
    if (filter?.acknowledged !== undefined) {
      alerts = alerts.filter((a) => a.acknowledged === filter.acknowledged);
    }

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return alerts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  // TODO: Cuando la API tenga un endpoint de alertas, integrarlo acá.
  // Por ahora las alertas se generan del overview de la AI API.
  // Como fallback temporal, usamos mock alerts.
  try {
    const overview = await getSilosOverview();
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    for (const silo of overview) {
      if (silo.risk_level === 'CRITICAL') {
        alerts.push({
          id: `alert-${silo.silo_id}-critical`,
          siloId: silo.silo_id,
          siloName: `Silobolsa ${silo.silo_id.replace('SILO_', 'SB-')}`,
          severity: 'critical',
          title: 'Riesgo crítico detectado',
          description: `Score de riesgo: ${silo.risk_score}/100. T:${silo.temperature}°C H:${silo.humidity}% CO2:${silo.co2}ppm`,
          recommendation: 'Inspección inmediata recomendada',
          timestamp: silo.last_update || now,
          acknowledged: false,
        });
      } else if (silo.risk_level === 'WARNING') {
        alerts.push({
          id: `alert-${silo.silo_id}-warning`,
          siloId: silo.silo_id,
          siloName: `Silobolsa ${silo.silo_id.replace('SILO_', 'SB-')}`,
          severity: 'medium',
          title: 'Condiciones inestables',
          description: `Score de riesgo: ${silo.risk_score}/100. Monitorear en las próximas 24 horas.`,
          recommendation: 'Revisar condiciones de almacenamiento',
          timestamp: silo.last_update || now,
          acknowledged: false,
        });
      }
    }

    // Aplicar filtros
    let filtered = alerts;
    if (filter?.severity) {
      filtered = filtered.filter((a) => a.severity === filter.severity);
    }
    if (filter?.siloId) {
      filtered = filtered.filter((a) => a.siloId === filter.siloId);
    }
    if (filter?.acknowledged !== undefined) {
      filtered = filtered.filter((a) => a.acknowledged === filter.acknowledged);
    }

    // Modo real: sin alertas reales => lista vacía (sin mock).
    return filtered;
  } catch {
    return [];
  }
}

// ── Most Critical Silo ──
export async function fetchMostCriticalSilo(): Promise<SiloBag | null> {
  const silos = await fetchSilobags();
  const critical = silos.filter((s) => s.state === 'critical');
  if (critical.length > 0) return critical[0];

  const warning = silos.filter((s) => s.state === 'warn');
  if (warning.length > 0) return warning[0];

  return silos[0] ?? null;
}
