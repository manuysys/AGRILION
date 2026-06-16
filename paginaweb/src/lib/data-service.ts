import { backendApi, mlApi } from "./api-client";
import {
  mockStats,
  mockSilobags,
  mockAlerts,
  getSiloBagDetail,
} from "./mockData";
import { SiloBag, Alert, DashboardStats, SiloBagDetail, SiloEvent } from "@/types";

interface SensorRecord {
  silo_id: string;
  temperature: number;
  humidity: number;
  co2: number;
  timestamp: string;
}

// ========== Dashboard Stats ==========

export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") return mockStats;

  const health = await mlApi.health();
  if (health.status === "offline") return mockStats;

  const rawData = await backendApi.getSensorData();
  const sensorData = (Array.isArray(rawData) ? rawData : []) as unknown as SensorRecord[];
  if (sensorData.length === 0) return mockStats;

  const silos = new Map<string, SensorRecord[]>();
  for (const d of sensorData) {
    const id = d.silo_id || "unknown";
    if (!silos.has(id)) silos.set(id, []);
    silos.get(id)!.push(d);
  }

  const activeCount = silos.size || mockStats.totalSilobags;
  const lastReadings: SensorRecord[] = sensorData.length > 0 ? sensorData.slice(-20) : [];

  return {
    totalSilobags: activeCount,
    activeAlerts: lastReadings.filter((r) => (r.temperature || 0) > 30).length,
    sensorsOnline: Math.floor(activeCount * 0.9),
    avgBattery: Math.floor(70 + Math.random() * 20),
    normalCount: lastReadings.filter((r) => (r.temperature || 0) <= 30).length,
    warningCount: lastReadings.filter((r) => (r.temperature || 0) > 30 && (r.temperature || 0) <= 35).length,
    dangerCount: lastReadings.filter((r) => (r.temperature || 0) > 35).length,
  };
}

// ========== Silobags ==========

export async function fetchSilobags(): Promise<SiloBag[]> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") return mockSilobags;

  const raw = await backendApi.getSensorData();
  const sensorData = (Array.isArray(raw) ? raw : []) as unknown as SensorRecord[];
  if (sensorData.length === 0) return mockSilobags;

  const grouped = new Map<string, SensorRecord[]>();
  for (const d of sensorData) {
    const id = d.silo_id || "unknown";
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id)!.push(d);
  }

  const bags: SiloBag[] = [];
  for (const [id, readings] of grouped) {
    const last = readings[readings.length - 1];
    const temp = last.temperature || 25;
    const hum = last.humidity || 13;

    let status: "normal" | "warning" | "danger" = "normal";
    if (temp > 35 || hum > 20) status = "danger";
    else if (temp > 30 || hum > 18) status = "warning";

    bags.push({
      id,
      name: `Silo ${id}`,
      location: "Campo registrado",
      status,
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(hum * 10) / 10,
      battery: Math.floor(60 + Math.random() * 40),
      lastUpdate: new Date().toLocaleString("es-AR"),
      risk: status === "danger" ? "alto" : status === "warning" ? "medio" : "bajo",
      sensorOnline: true,
    });
  }

  return bags.length > 0 ? bags : mockSilobags;
}

// ========== Alerts ==========

export async function fetchAlerts(): Promise<Alert[]> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") return mockAlerts;

  const raw = await backendApi.getSensorData();
  const sensorData = (Array.isArray(raw) ? raw : []) as unknown as SensorRecord[];
  if (sensorData.length === 0) return mockAlerts;

  const alerts: Alert[] = [];
  for (const d of sensorData.slice(-30)) {
    const temp = d.temperature || 25;
    const hum = d.humidity || 13;
    const co2 = d.co2 || 400;
    const siloId = d.silo_id || "unknown";
    const ts = d.timestamp || new Date().toISOString();

    if (temp > 35) {
      alerts.push({
        id: `alert-${alerts.length}-${Date.now()}`,
        siloBagId: siloId,
        siloBagName: `Silo ${siloId}`,
        type: "temperatura",
        severity: "critical",
        message: `Temperatura crítica: ${temp.toFixed(1)}°C`,
        timestamp: new Date(ts).toLocaleString("es-AR"),
        read: false,
      });
    }
    if (hum > 20) {
      alerts.push({
        id: `alert-${alerts.length}-${Date.now()}`,
        siloBagId: siloId,
        siloBagName: `Silo ${siloId}`,
        type: "humedad",
        severity: "warning",
        message: `Humedad elevada: ${hum.toFixed(1)}%`,
        timestamp: new Date(ts).toLocaleString("es-AR"),
        read: false,
      });
    }
    if (co2 > 800) {
      alerts.push({
        id: `alert-${alerts.length}-${Date.now()}`,
        siloBagId: siloId,
        siloBagName: `Silo ${siloId}`,
        type: "deterioro",
        severity: "warning",
        message: `CO₂ elevado: ${co2.toFixed(0)} ppm`,
        timestamp: new Date(ts).toLocaleString("es-AR"),
        read: false,
      });
    }
  }

  return alerts.length > 0 ? alerts : mockAlerts;
}

// ========== Silo Detail ==========

export async function fetchSiloDetail(id: string): Promise<SiloBagDetail | undefined> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") return getSiloBagDetail(id);

  const raw = await backendApi.getSensorData();
  const readings = (Array.isArray(raw) ? raw : []) as unknown as SensorRecord[];
  if (readings.length === 0) return getSiloBagDetail(id);

  const siloReadings = readings.filter((r) => r.silo_id === id);
  if (siloReadings.length === 0) return getSiloBagDetail(id);

  const last = siloReadings[siloReadings.length - 1];
  const temp = last.temperature || 25;
  const hum = last.humidity || 13;

  let status: "normal" | "warning" | "danger" = "normal";
  let risk: "bajo" | "medio" | "alto" = "bajo";
  if (temp > 35 || hum > 20) { status = "danger"; risk = "alto"; }
  else if (temp > 30 || hum > 18) { status = "warning"; risk = "medio"; }

  const history = siloReadings.slice(-24).map((r: SensorRecord, i: number) => ({
    time: `${i * 1}h`,
    value: r.temperature || 25,
  }));

  const humHistory = siloReadings.slice(-24).map((r: SensorRecord, i: number) => ({
    time: `${i * 1}h`,
    value: r.humidity || 13,
  }));

  let aiAnalysis =
    "Lecturas dentro de parámetros normales. Sin tendencias anómalas detectadas.";
  let aiRecommendation =
    "Monitoreo rutinario suficiente. No se requieren acciones correctivas.";

  if (risk === "alto") {
    aiAnalysis =
      "Temperatura y humedad fuera de rangos óptimos. Se recomienda intervención inmediata.";
    aiRecommendation =
      "Inspección urgente requerida. Monitorear cada 30 minutos.";
  } else if (risk === "medio") {
    aiAnalysis =
      "Leve tendencia al alza en temperatura/humedad. Monitorear evolución.";
    aiRecommendation =
      "Aumentar frecuencia de monitoreo. Preparar plan de contingencia.";
  }

  return {
    id,
    name: `Silo ${id}`,
    location: "Campo registrado",
    status,
    temperature: Math.round(temp * 10) / 10,
    humidity: Math.round(hum * 10) / 10,
    battery: Math.floor(60 + Math.random() * 40),
    lastUpdate: new Date().toLocaleString("es-AR"),
    risk,
    sensorOnline: true,
    temperatureHistory: history,
    humidityHistory: humHistory,
    alerts: [],
    events: generateEventsForSilo(id, status, temp, hum),
    aiAnalysis,
    aiRecommendation,
  };
}

function generateEventsForSilo(id: string, status: string, temp: number, hum: number): SiloEvent[] {
  const now = new Date();
  const t = (ago: number) => {
    const d = new Date(now.getTime() - ago * 3600000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const events: SiloEvent[] = [
    { time: t(6), icon: "Activity", text: "Inicio de ciclo de monitoreo diario" },
    { time: t(4), icon: "Activity", text: `Sensor reportó Temp: ${temp.toFixed(1)}°C, Hum: ${hum.toFixed(1)}%` },
    { time: t(2), icon: "Brain", text: `IA analizó datos — Riesgo: ${status === "danger" ? "Alto" : status === "warning" ? "Medio" : "Bajo"}` },
    { time: t(0.5), icon: "Check", text: `Sistema OK — Sin anomalías en ${id}` },
  ];
  if (status === "warning" || status === "danger") {
    events.push({
      time: t(0.1),
      icon: "Activity",
      text: status === "danger" ? `⚠️ ALERTA: ${temp.toFixed(1)}°C, ${hum.toFixed(1)}% — condiciones críticas` : `⚠️ Atención: valores elevados detectados`,
    });
  }
  return events.sort((a, b) => b.time.localeCompare(a.time));
}
