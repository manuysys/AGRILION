export interface SiloBag {
  id: string;
  name: string;
  location: string;
  status: "normal" | "warning" | "danger";
  temperature: number;
  humidity: number;
  battery: number;
  lastUpdate: string;
  risk: "bajo" | "medio" | "alto";
  co2?: number;
  sensorOnline: boolean;
}

export interface Alert {
  id: string;
  siloBagId: string;
  siloBagName: string;
  type: "humedad" | "temperatura" | "condensacion" | "deterioro" | "bateria";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface SiloEvent {
  time: string;
  icon: "Activity" | "Brain" | "Check";
  text: string;
}

export interface SiloBagDetail extends SiloBag {
  temperatureHistory: ChartDataPoint[];
  humidityHistory: ChartDataPoint[];
  co2History?: ChartDataPoint[];
  alerts: Alert[];
  events: SiloEvent[];
  aiAnalysis: string;
  aiRecommendation: string;
}

export interface DashboardStats {
  totalSilobags: number;
  activeAlerts: number;
  sensorsOnline: number;
  avgBattery: number;
  normalCount: number;
  warningCount: number;
  dangerCount: number;
}
