// ── Sensor Reading ──
export interface SensorReading {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
}

// ── Sensor Status ──
export type SensorConnectionStatus = 'online' | 'delayed' | 'offline';

export interface SensorStatus {
  connection: SensorConnectionStatus;
  battery: number; // 0-100
  lastSeen: string; // ISO timestamp
  signalStrength: number; // dBm
}

// ── Health State ──
export type HealthState = 'ok' | 'warn' | 'critical' | 'offline';

// ── Alert Severity ──
export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

// ── Alert ──
export interface Alert {
  id: string;
  siloId: string;
  siloName: string;
  severity: AlertSeverity;
  title: string;
  description: string; // Human-readable explanation
  recommendation: string; // Suggested action
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

// ── Risk Score ──
export interface RiskScore {
  value: number; // 0-100
  band: 'normal' | 'warning' | 'danger';
  label: string; // e.g. "Estable", "Atención", "Crítico"
  trend: 'stable' | 'rising' | 'falling';
}

// ── AI Interpretation ──
export interface AIInterpretation {
  summary: string; // e.g. "Posible fermentación detectada"
  recommendation: string;
  confidence: number; // 0-100
  factors: string[];
}

// ── Silo Bag ──
export interface SiloBag {
  id: string;
  name: string;
  location: string;
  grainType: string;
  state: HealthState;
  riskScore: RiskScore;
  currentReading: SensorReading;
  previousReading?: SensorReading;
  sensor: SensorStatus;
  interpretation: AIInterpretation;
  readings24h: SensorReading[];
  alerts: Alert[];
  storedSince: string; // ISO date
  estimatedTons: number;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  totalSilos: number;
  activeSensors: number;
  totalSensors: number;
  activeAlerts: number;
  criticalAlerts: number;
  averageBattery: number;
  lastGlobalUpdate: string;
  systemHealth: HealthState;
}

// ── Chart Data Point ──
export interface ChartDataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
  tempThresholdWarn?: number;
  tempThresholdCritical?: number;
  humThresholdWarn?: number;
  humThresholdCritical?: number;
}

// ── Historical Range ──
export type TimeRange = '6h' | '12h' | '24h' | '48h' | '7d' | '30d';
