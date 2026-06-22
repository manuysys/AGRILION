// Mock data for Agrilion+ demo mode
// 6 silobolsas with varied states for realistic demonstration

import type { SiloBag, Alert, DashboardStats, SensorReading } from '@/types';

// ── Helper: generate 24h of readings ──
function generateReadings24h(
  baseTemp: number,
  baseHum: number,
  baseCO2: number,
  volatility: number = 0.5
): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = new Date();

  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const noise = () => (Math.random() - 0.5) * 2 * volatility;
    const trend = i < 8 ? (24 - i) * 0.05 * volatility : 0; // rising trend in recent hours

    readings.push({
      timestamp: time.toISOString(),
      temperature: +(baseTemp + noise() + trend).toFixed(1),
      humidity: +(baseHum + noise() * 0.8 + trend * 0.5).toFixed(1),
      co2: +(baseCO2 + noise() * 30 + trend * 15).toFixed(0),
    });
  }

  return readings;
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

// ── Alerts ──
export const mockAlerts: Alert[] = [
  {
    id: 'ALT-001',
    siloId: 'SB-005',
    siloName: 'Lote Sur A',
    severity: 'critical',
    title: 'Fermentación probable',
    description: 'Aumento simultáneo de humedad (18.2%) y temperatura (31.4°C) indica posible proceso de fermentación del grano.',
    recommendation: 'Inspección presencial inmediata. Verificar estado del grano en la zona del sensor.',
    timestamp: hoursAgo(1),
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    siloId: 'SB-005',
    siloName: 'Lote Sur A',
    severity: 'high',
    title: 'CO₂ en niveles críticos',
    description: 'Concentración de CO₂ alcanzó 820 ppm, indicador de actividad biológica activa dentro de la silobolsa.',
    recommendation: 'Preparar sistema de aireación. Coordinar con equipo técnico.',
    timestamp: hoursAgo(2),
    acknowledged: false,
  },
  {
    id: 'ALT-003',
    siloId: 'SB-003',
    siloName: 'Lote Norte B',
    severity: 'medium',
    title: 'Humedad en ascenso',
    description: 'Humedad incrementó de 13.5% a 15.8% en las últimas 12 horas. Posible ingreso de humedad externa.',
    recommendation: 'Monitoreo reforzado. Verificar sellado de la silobolsa en próxima ronda.',
    timestamp: hoursAgo(4),
    acknowledged: false,
  },
  {
    id: 'ALT-004',
    siloId: 'SB-010',
    siloName: 'Lote Este C',
    severity: 'medium',
    title: 'Temperatura elevada',
    description: 'Temperatura registra 28.1°C, por encima del umbral normal (28°C). Podría responder a condiciones climáticas.',
    recommendation: 'Verificar si la tendencia continúa en las próximas 6 horas.',
    timestamp: hoursAgo(3),
    acknowledged: true,
  },
  {
    id: 'ALT-005',
    siloId: 'SB-011',
    siloName: 'Lote Oeste D',
    severity: 'low',
    title: 'Sensor sin señal',
    description: 'Última lectura recibida hace más de 14 horas. Posible batería agotada o pérdida de señal LoRa.',
    recommendation: 'Revisar sensor in situ. Verificar batería y posición de la antena.',
    timestamp: hoursAgo(14),
    acknowledged: false,
  },
  {
    id: 'ALT-006',
    siloId: 'SB-010',
    siloName: 'Lote Este C',
    severity: 'low',
    title: 'Batería baja',
    description: 'Nivel de batería del sensor en 45%. Se recomienda planificar reemplazo.',
    recommendation: 'Programar reemplazo de batería en próxima visita a campo.',
    timestamp: hoursAgo(8),
    acknowledged: true,
  },
];

// ── Silo Bags ──
export const mockSiloBags: SiloBag[] = [
  {
    id: 'SB-005',
    name: 'Lote Sur A',
    location: 'Campo Sur, Parcela 5',
    grainType: 'Soja',
    state: 'critical',
    riskScore: { value: 87, band: 'danger', label: 'Crítico', trend: 'rising' },
    currentReading: { timestamp: hoursAgo(0.5), temperature: 31.4, humidity: 18.2, co2: 820 },
    previousReading: { timestamp: hoursAgo(2), temperature: 29.8, humidity: 17.1, co2: 780 },
    sensor: { connection: 'online', battery: 34, lastSeen: hoursAgo(0.5), signalStrength: -85 },
    interpretation: {
      summary: 'Posible fermentación detectada por aumento de humedad y temperatura',
      recommendation: 'Inspección presencial INMEDIATA',
      confidence: 92,
      factors: ['Temperatura 31.4°C', 'Humedad 18.2%', 'CO₂ 820 ppm', 'ΔTemp +1.6°C en 2h'],
    },
    readings24h: generateReadings24h(28, 16, 720, 1.5),
    alerts: mockAlerts.filter((a) => a.siloId === 'SB-005'),
    storedSince: daysAgo(45),
    estimatedTons: 180,
  },
  {
    id: 'SB-003',
    name: 'Lote Norte B',
    location: 'Campo Norte, Parcela 3',
    grainType: 'Trigo',
    state: 'warn',
    riskScore: { value: 33, band: 'warning', label: 'Atención', trend: 'rising' },
    currentReading: { timestamp: hoursAgo(1), temperature: 27.2, humidity: 15.8, co2: 580 },
    previousReading: { timestamp: hoursAgo(3), temperature: 26.5, humidity: 14.9, co2: 560 },
    sensor: { connection: 'online', battery: 72, lastSeen: hoursAgo(1), signalStrength: -72 },
    interpretation: {
      summary: 'Humedad en ascenso — monitoreo reforzado recomendado',
      recommendation: 'Verificar sellado de la silobolsa',
      confidence: 78,
      factors: ['Humedad 15.8%', 'Tendencia ascendente'],
    },
    readings24h: generateReadings24h(25, 14, 540, 0.8),
    alerts: mockAlerts.filter((a) => a.siloId === 'SB-003'),
    storedSince: daysAgo(30),
    estimatedTons: 220,
  },
  {
    id: 'SB-010',
    name: 'Lote Este C',
    location: 'Campo Este, Parcela 10',
    grainType: 'Maíz',
    state: 'warn',
    riskScore: { value: 31, band: 'warning', label: 'Atención', trend: 'stable' },
    currentReading: { timestamp: hoursAgo(1.5), temperature: 28.1, humidity: 17.0, co2: 610 },
    previousReading: { timestamp: hoursAgo(3.5), temperature: 27.8, humidity: 16.5, co2: 595 },
    sensor: { connection: 'online', battery: 45, lastSeen: hoursAgo(1.5), signalStrength: -78 },
    interpretation: {
      summary: 'Temperatura ligeramente elevada — probablemente efecto climático',
      recommendation: 'Monitorear evolución en próximas 6 horas',
      confidence: 65,
      factors: ['Temperatura 28.1°C'],
    },
    readings24h: generateReadings24h(26, 15.5, 570, 0.6),
    alerts: mockAlerts.filter((a) => a.siloId === 'SB-010'),
    storedSince: daysAgo(60),
    estimatedTons: 150,
  },
  {
    id: 'SB-001',
    name: 'Lote Central A',
    location: 'Campo Central, Parcela 1',
    grainType: 'Soja',
    state: 'ok',
    riskScore: { value: 12, band: 'normal', label: 'Estable', trend: 'stable' },
    currentReading: { timestamp: hoursAgo(1), temperature: 24.5, humidity: 12.3, co2: 420 },
    previousReading: { timestamp: hoursAgo(3), temperature: 24.2, humidity: 12.1, co2: 415 },
    sensor: { connection: 'online', battery: 88, lastSeen: hoursAgo(1), signalStrength: -65 },
    interpretation: {
      summary: 'Condiciones estables — grano en buen estado',
      recommendation: 'Sin acción requerida',
      confidence: 95,
      factors: ['Todos los parámetros normales'],
    },
    readings24h: generateReadings24h(23.5, 12, 410, 0.3),
    alerts: [],
    storedSince: daysAgo(90),
    estimatedTons: 200,
  },
  {
    id: 'SB-007',
    name: 'Lote Central B',
    location: 'Campo Central, Parcela 7',
    grainType: 'Trigo',
    state: 'ok',
    riskScore: { value: 8, band: 'normal', label: 'Estable', trend: 'falling' },
    currentReading: { timestamp: hoursAgo(2), temperature: 22.1, humidity: 11.5, co2: 390 },
    previousReading: { timestamp: hoursAgo(4), temperature: 22.5, humidity: 11.8, co2: 395 },
    sensor: { connection: 'online', battery: 91, lastSeen: hoursAgo(2), signalStrength: -60 },
    interpretation: {
      summary: 'Condiciones óptimas de conservación',
      recommendation: 'Sin acción requerida',
      confidence: 97,
      factors: ['Todos los parámetros normales'],
    },
    readings24h: generateReadings24h(22, 11.2, 385, 0.2),
    alerts: [],
    storedSince: daysAgo(120),
    estimatedTons: 250,
  },
  {
    id: 'SB-011',
    name: 'Lote Oeste D',
    location: 'Campo Oeste, Parcela 11',
    grainType: 'Girasol',
    state: 'offline',
    riskScore: { value: 0, band: 'normal', label: 'Sin datos', trend: 'stable' },
    currentReading: { timestamp: hoursAgo(14), temperature: 25.0, humidity: 13.2, co2: 450 },
    previousReading: { timestamp: hoursAgo(16), temperature: 24.8, humidity: 13.0, co2: 445 },
    sensor: { connection: 'offline', battery: 5, lastSeen: hoursAgo(14), signalStrength: -110 },
    interpretation: {
      summary: 'Sensor sin señal — última lectura hace 14 horas',
      recommendation: 'Revisar sensor in situ. Posible batería agotada o pérdida de señal',
      confidence: 30,
      factors: ['Sin datos recientes', 'Batería 5%'],
    },
    readings24h: generateReadings24h(24, 13, 440, 0.3).slice(0, 10), // only 10h of data
    alerts: mockAlerts.filter((a) => a.siloId === 'SB-011'),
    storedSince: daysAgo(75),
    estimatedTons: 130,
  },
];

// ── Dashboard Stats ──
export const mockDashboardStats: DashboardStats = {
  totalSilos: mockSiloBags.length,
  activeSensors: mockSiloBags.filter((s) => s.sensor.connection !== 'offline').length,
  totalSensors: mockSiloBags.length,
  activeAlerts: mockAlerts.filter((a) => !a.acknowledged).length,
  criticalAlerts: mockAlerts.filter((a) => a.severity === 'critical').length,
  averageBattery: Math.round(
    mockSiloBags.reduce((acc, s) => acc + s.sensor.battery, 0) / mockSiloBags.length
  ),
  lastGlobalUpdate: hoursAgo(0.5),
  systemHealth: 'critical', // because SB-005 is critical
};
