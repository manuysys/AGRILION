import { SiloBag, Alert, SiloBagDetail, DashboardStats, SiloEvent } from "@/types";

const now = new Date();
const time = (h: number) =>
  new Date(now.getTime() - h * 3600000).toLocaleString("es-AR");

export const mockStats: DashboardStats = {
  totalSilobags: 12,
  activeAlerts: 3,
  sensorsOnline: 11,
  avgBattery: 78,
  normalCount: 8,
  warningCount: 3,
  dangerCount: 1,
};

export const mockSilobags: SiloBag[] = [
  { id: "SB-001", name: "Lote Norte A", location: "Campo 1 - Zona Norte", status: "normal", temperature: 24.5, humidity: 12.3, battery: 85, lastUpdate: time(1), risk: "bajo", sensorOnline: true },
  { id: "SB-002", name: "Lote Norte B", location: "Campo 1 - Zona Norte", status: "normal", temperature: 23.8, humidity: 13.1, battery: 92, lastUpdate: time(2), risk: "bajo", sensorOnline: true },
  { id: "SB-003", name: "Lote Este", location: "Campo 2 - Zona Este", status: "warning", temperature: 27.2, humidity: 15.8, battery: 67, lastUpdate: time(0.5), risk: "medio", sensorOnline: true },
  { id: "SB-004", name: "Lote Oeste", location: "Campo 2 - Zona Oeste", status: "normal", temperature: 22.1, humidity: 11.5, battery: 73, lastUpdate: time(3), risk: "bajo", sensorOnline: true },
  { id: "SB-005", name: "Lote Sur A", location: "Campo 3 - Zona Sur", status: "danger", temperature: 31.4, humidity: 18.2, battery: 34, lastUpdate: time(0.3), risk: "alto", sensorOnline: true },
  { id: "SB-006", name: "Lote Sur B", location: "Campo 3 - Zona Sur", status: "normal", temperature: 25.0, humidity: 12.9, battery: 88, lastUpdate: time(1.5), risk: "bajo", sensorOnline: true },
  { id: "SB-007", name: "Lote Central", location: "Campo 1 - Zona Central", status: "warning", temperature: 26.7, humidity: 16.3, battery: 56, lastUpdate: time(0.8), risk: "medio", sensorOnline: true },
  { id: "SB-008", name: "Lote Este 2", location: "Campo 2 - Zona Este", status: "normal", temperature: 24.0, humidity: 12.0, battery: 91, lastUpdate: time(4), risk: "bajo", sensorOnline: true },
  { id: "SB-009", name: "Lote Norte C", location: "Campo 1 - Zona Norte", status: "normal", temperature: 23.5, humidity: 11.8, battery: 79, lastUpdate: time(2.5), risk: "bajo", sensorOnline: true },
  { id: "SB-010", name: "Lote Oeste 2", location: "Campo 2 - Zona Oeste", status: "warning", temperature: 28.1, humidity: 17.0, battery: 45, lastUpdate: time(1.2), risk: "medio", sensorOnline: true },
  { id: "SB-011", name: "Lote Sur C", location: "Campo 3 - Zona Sur", status: "normal", temperature: 24.8, humidity: 13.4, battery: 82, lastUpdate: time(3.5), risk: "bajo", sensorOnline: false },
  { id: "SB-012", name: "Lote Central 2", location: "Campo 1 - Zona Central", status: "normal", temperature: 23.2, humidity: 12.7, battery: 76, lastUpdate: time(2), risk: "bajo", sensorOnline: true },
];

export const mockAlerts: Alert[] = [
  { id: "ALT-001", siloBagId: "SB-005", siloBagName: "Lote Sur A", type: "humedad", severity: "critical", message: "Humedad crítica: 18.2% - Riesgo de filtración", timestamp: time(0.3), read: false },
  { id: "ALT-002", siloBagId: "SB-003", siloBagName: "Lote Este", type: "temperatura", severity: "warning", message: "Temperatura elevada: 27.2°C - Posible actividad microbiana", timestamp: time(0.5), read: false },
  { id: "ALT-003", siloBagId: "SB-010", siloBagName: "Lote Oeste 2", type: "condensacion", severity: "warning", message: "Riesgo de condensación por diferencial térmico", timestamp: time(1.2), read: false },
  { id: "ALT-004", siloBagId: "SB-007", siloBagName: "Lote Central", type: "deterioro", severity: "info", message: "Detección temprana de posible deterioro en zona periférica", timestamp: time(0.8), read: true },
  { id: "ALT-005", siloBagId: "SB-005", siloBagName: "Lote Sur A", type: "bateria", severity: "warning", message: "Batería baja: 34% - Reemplazo próximo requerido", timestamp: time(0.3), read: false },
];

const generateHistory = (base: number, variance: number, points: number): { time: string; value: number }[] =>
  Array.from({ length: points }, (_, i) => ({
    time: `${i * 2}h`,
    value: Math.round((base + (Math.random() - 0.5) * variance) * 10) / 10,
  }));

const generateEvents = (bag: SiloBag): SiloEvent[] => {
  const h = (ago: number) => {
    const d = new Date(Date.now() - ago * 3600000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const events: SiloEvent[] = [
    { time: h(6), icon: "Activity", text: "Inicio de ciclo de monitoreo diario" },
    { time: h(5), icon: "Activity", text: `Sensor reportó Temp: ${bag.temperature}°C, Hum: ${bag.humidity}%` },
    { time: h(4), icon: "Activity", text: `CO₂: ${bag.co2 || 400} ppm — ${(bag.co2 || 400) > 600 ? "por encima de lo normal" : "niveles normales"}` },
    { time: h(3), icon: "Brain", text: `IA analizó datos — Riesgo: ${bag.risk === "alto" ? "Alto — se requiere intervención" : bag.risk === "medio" ? "Medio — monitoreo reforzado" : "Bajo — sin anomalías"}` },
    { time: h(1), icon: "Check", text: `Sistema OK — Batería: ${bag.battery}%` },
  ];

  if (bag.status === "warning" || bag.status === "danger") {
    const alertEvent: SiloEvent = {
      time: h(0.5),
      icon: "Activity",
      text: bag.status === "danger"
        ? `⚠️ ALERTA: ${bag.temperature}°C, ${bag.humidity}% — condiciones críticas`
        : `⚠️ Atención: ${bag.temperature}°C, ${bag.humidity}% — valores elevados`,
    };
    events.push(alertEvent);
  }

  return events.sort((a, b) => b.time.localeCompare(a.time));
};

export const getSiloBagDetail = (id: string): SiloBagDetail | undefined => {
  const bag = mockSilobags.find((s) => s.id === id);
  if (!bag) return undefined;
  return {
    ...bag,
    temperatureHistory: generateHistory(bag.temperature, 4, 24),
    humidityHistory: generateHistory(bag.humidity, 4, 24),
    alerts: mockAlerts.filter((a) => a.siloBagId === id),
    events: generateEvents(bag),
    aiAnalysis:
      bag.risk === "alto"
        ? "Se detecta una tendencia ascendente sostenida de humedad y temperatura en las últimas 6 horas. Los niveles de CO₂ muestran un incremento atípico, lo que sugiere actividad microbiana incipiente. El gradiente térmico interno-externo también favorece la condensación."
        : bag.risk === "medio"
        ? "Se observa una leve tendencia al alza en temperatura y humedad. Aunque los valores aún están dentro de rangos tolerables, el patrón sugiere monitoreo más frecuente. No se detectan anomalías en CO₂."
        : "Las lecturas se mantienen estables dentro de los parámetros óptimos. No se detectan tendencias anómalas. El grano se conserva en condiciones adecuadas.",
    aiRecommendation:
      bag.risk === "alto"
        ? "Se recomienda inspección presencial inmediata. Programar aireación si es posible. Monitorear cada 30 minutos."
        : bag.risk === "medio"
        ? "Se recomienda aumentar frecuencia de monitoreo a cada 1 hora. Preparar plan de contingencia."
        : "Sin acciones requeridas. El monitoreo rutinario cada 2 horas es suficiente.",
  };
};
