// Data service layer — abstracts demo vs real API data sources.
//
// When NEXT_PUBLIC_MOCK_MODE is true, returns the simulated demo data.
// When it is false, calls the Python AI API via Next.js rewrites.
// En modo real no se inventan datos: si la API falla o no hay lecturas se
// devuelve un estado vacío y la UI muestra el aviso correspondiente.

import type { SiloBag, Alert, DashboardStats, SensorConnectionStatus } from '@/types';
import { mockSiloBags, mockAlerts, mockDashboardStats } from './mock-data';
import { getRiskBand, THRESHOLDS } from './thresholds';
import {
  getSilosOverview,
  getSiloHistory,
  type SiloOverview,
} from './ai-api';
import { getSessionToken } from './session-server';

export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskLevelToState(level: string): 'ok' | 'warn' | 'critical' {
  if (level === 'CRITICAL') return 'critical';
  if (level === 'WARNING') return 'warn';
  return 'ok';
}

function connectionStatus(lastSeen: string): SensorConnectionStatus {
  const timestamp = new Date(lastSeen).getTime();
  if (!Number.isFinite(timestamp)) return 'offline';

  const age = Date.now() - timestamp;
  if (age >= THRESHOLDS.sensorTimeout.offline) return 'offline';
  if (age >= THRESHOLDS.sensorTimeout.delayed) return 'delayed';
  return 'online';
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
  const now = new Date().toISOString();
  const lastSeen = o.last_update || now;
  const connection = connectionStatus(lastSeen);
  const riskState = riskLevelToState(o.risk_level);
  const state: SiloBag['state'] = connection === 'offline' ? 'offline' : riskState;
  const hasCoordinates = typeof o.latitude === 'number' && typeof o.longitude === 'number';
  const coordinates = hasCoordinates
    ? { latitude: o.latitude as number, longitude: o.longitude as number }
    : null;

  return {
    id: o.silo_id,
    name: `Silobolsa ${o.silo_id.replace('SILO_', 'SB-')}`,
    location: coordinates
      ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
      : 'Sin ubicación',
    grainType: o.grain_type ? capitalize(o.grain_type) : 'Sin dato',
    coordinates,
    gps: {
      hasFix: Boolean(o.gps_has_fix ?? hasCoordinates),
      currentFix: Boolean(o.gps_fix),
      satellites: o.gps_satellites ?? null,
      hdop: o.gps_hdop ?? null,
      ageMin: o.gps_age_min ?? null,
    },
    state,
    riskScore: {
      value: o.risk_score,
      band: riskScoreToBand(o.risk_score),
      label: riskScoreToLabel(o.risk_score),
      trend: 'stable',
    },
    currentReading: {
      timestamp: lastSeen,
      temperature: o.temperature,
      humidity: o.humidity,
      co2: o.co2,
      pressure: o.pressure ?? null,
    },
    sensor: {
      connection,
      battery: null,
      lastSeen,
      signalStrength: null,
    },
    interpretation: {
      summary: connection === 'offline'
        ? 'Sin datos recientes del sensor'
        : riskState === 'ok'
          ? 'Parámetros dentro de rangos normales'
          : riskState === 'warn'
            ? 'Condiciones requieren monitoreo'
            : 'Riesgo detectado — requiere intervención',
      recommendation: connection === 'offline'
        ? 'Verificar alimentación, señal LoRa y estado del nodo'
        : riskState === 'critical'
          ? 'Inspección inmediata recomendada'
          : riskState === 'warn'
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
  lastGlobalUpdate: new Date(0).toISOString(),
  systemHealth: 'warn',
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (IS_DEMO_MODE) return mockDashboardStats;

  try {
    const [silos, alerts] = await Promise.all([fetchSilobags(), fetchAlerts()]);
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
    const staleCount = silos.filter(s => s.sensor.connection !== 'online').length;

    let systemHealth: 'ok' | 'warn' | 'critical' = 'ok';
    if (criticalCount > 0) systemHealth = 'critical';
    else if (warnCount > 0 || staleCount > 0 || totalSilos === 0) systemHealth = 'warn';

    const latestReading = silos.reduce((latest, silo) => {
      const value = new Date(silo.sensor.lastSeen).getTime();
      return Number.isFinite(value) && value > latest ? value : latest;
    }, 0);

    return {
      totalSilos,
      activeSensors: onlineSilos,
      totalSensors: totalSilos,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      averageBattery: avgBattery,
      lastGlobalUpdate: latestReading > 0 ? new Date(latestReading).toISOString() : EMPTY_STATS.lastGlobalUpdate,
      systemHealth,
    };
  } catch {
    // En modo real no se inventan datos: se devuelve el estado vacío.
    return EMPTY_STATS;
  }
}

// ── Silo Bags ──
export async function fetchSilobags(): Promise<SiloBag[]> {
  if (IS_DEMO_MODE) {
    // Sort by risk score (descending) for ranking
    return [...mockSiloBags].sort((a, b) => b.riskScore.value - a.riskScore.value);
  }

  // Modo real: la cookie httpOnly contiene el Firebase ID token.
  const token = await getSessionToken();
  const overview = await getSilosOverview(token);
  const silos = overview.map(overviewToSiloBag);
  return silos.sort((a, b) => b.riskScore.value - a.riskScore.value);
}

// ── Single Silo Detail ──
export async function fetchSiloDetail(id: string): Promise<SiloBag | null> {
  if (IS_DEMO_MODE) {
    return mockSiloBags.find((s) => s.id === id) ?? null;
  }

  try {
    // Primero obtener el overview para encontrar este silo
    const token = await getSessionToken();
    const overview = await getSilosOverview(token);
    const siloOverview = overview.find(s => s.silo_id === id);

    if (!siloOverview) {
      return null;
    }

    const siloBag = overviewToSiloBag(siloOverview);

    // Cargar historial de 24h
    const history = await getSiloHistory(id, 24, token);
    if (history.length > 0) {
      siloBag.readings24h = history.map(h => ({
        timestamp: h.timestamp,
        temperature: h.temperature,
        humidity: h.humidity,
        co2: h.co2,
        pressure: h.pressure ?? null,
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
  if (IS_DEMO_MODE) {
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
    const token = await getSessionToken();
    const overview = await getSilosOverview(token);
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    for (const silo of overview) {
      const lastSeen = silo.last_update || now;
      const connection = connectionStatus(lastSeen);
      const siloName = `Silobolsa ${silo.silo_id.replace('SILO_', 'SB-')}`;

      if (silo.risk_level === 'CRITICAL') {
        alerts.push({
          id: `alert-${silo.silo_id}-critical`,
          siloId: silo.silo_id,
          siloName,
          severity: 'critical',
          title: 'Riesgo crítico detectado',
          description: `Score de riesgo: ${silo.risk_score}/100. T:${silo.temperature}°C H:${silo.humidity}% CO2:${silo.co2}ppm`,
          recommendation: 'Inspección inmediata recomendada',
          timestamp: lastSeen,
          acknowledged: false,
        });
      } else if (silo.risk_level === 'WARNING') {
        alerts.push({
          id: `alert-${silo.silo_id}-warning`,
          siloId: silo.silo_id,
          siloName,
          severity: 'medium',
          title: 'Condiciones inestables',
          description: `Score de riesgo: ${silo.risk_score}/100. Monitorear en las próximas 24 horas.`,
          recommendation: 'Revisar condiciones de almacenamiento',
          timestamp: lastSeen,
          acknowledged: false,
        });
      }

      if (connection === 'offline') {
        alerts.push({
          id: `alert-${silo.silo_id}-offline`,
          siloId: silo.silo_id,
          siloName,
          severity: 'medium',
          title: 'Sensor sin datos recientes',
          description: `La última lectura se recibió el ${new Date(lastSeen).toLocaleString('es-AR')}.`,
          recommendation: 'Verificar alimentación, señal LoRa y estado del nodo',
          timestamp: lastSeen,
          acknowledged: false,
        });
      } else if (connection === 'delayed') {
        alerts.push({
          id: `alert-${silo.silo_id}-delayed`,
          siloId: silo.silo_id,
          siloName,
          severity: 'low',
          title: 'Lectura demorada',
          description: `La última lectura se recibió el ${new Date(lastSeen).toLocaleString('es-AR')}.`,
          recommendation: 'Confirmar la conectividad del nodo antes del próximo ciclo',
          timestamp: lastSeen,
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
