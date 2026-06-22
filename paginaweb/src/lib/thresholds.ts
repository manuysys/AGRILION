// Centralized threshold constants for Agrilion+ sensor monitoring

export const THRESHOLDS = {
  temperature: {
    normal: { min: 10, max: 28 },
    warning: { min: 28, max: 35 },
    critical: { min: 35, max: 60 },
    unit: '°C',
  },
  humidity: {
    normal: { min: 8, max: 14 },
    warning: { min: 14, max: 17 },
    critical: { min: 17, max: 30 },
    unit: '%',
  },
  co2: {
    normal: { min: 300, max: 600 },
    warning: { min: 600, max: 800 },
    critical: { min: 800, max: 2000 },
    unit: 'ppm',
  },
  riskScore: {
    normal: { min: 0, max: 30 },
    warning: { min: 30, max: 35 },
    danger: { min: 35, max: 100 },
  },
  battery: {
    ok: { min: 40, max: 100 },
    low: { min: 20, max: 40 },
    critical: { min: 0, max: 20 },
  },
  sensorTimeout: {
    delayed: 4 * 60 * 60 * 1000,  // 4 hours
    offline: 6 * 60 * 60 * 1000,  // 6 hours
  },
} as const;

export function getTemperatureState(value: number): 'ok' | 'warn' | 'critical' {
  if (value >= THRESHOLDS.temperature.critical.min) return 'critical';
  if (value >= THRESHOLDS.temperature.warning.min) return 'warn';
  return 'ok';
}

export function getHumidityState(value: number): 'ok' | 'warn' | 'critical' {
  if (value >= THRESHOLDS.humidity.critical.min) return 'critical';
  if (value >= THRESHOLDS.humidity.warning.min) return 'warn';
  return 'ok';
}

export function getCO2State(value: number): 'ok' | 'warn' | 'critical' {
  if (value >= THRESHOLDS.co2.critical.min) return 'critical';
  if (value >= THRESHOLDS.co2.warning.min) return 'warn';
  return 'ok';
}

export function getRiskBand(score: number): 'normal' | 'warning' | 'danger' {
  if (score > THRESHOLDS.riskScore.warning.max) return 'danger';
  if (score > THRESHOLDS.riskScore.normal.max) return 'warning';
  return 'normal';
}

export function getBatteryState(level: number): 'ok' | 'low' | 'critical' {
  if (level < THRESHOLDS.battery.critical.max) return 'critical';
  if (level < THRESHOLDS.battery.low.max) return 'low';
  return 'ok';
}
