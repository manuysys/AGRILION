// AI Interpretation Engine
// Translates raw sensor data into human-readable explanations in Spanish

import type { SensorReading, AIInterpretation, SiloBag } from '@/types';

interface InterpretationRule {
  id: string;
  condition: (reading: SensorReading, previous?: SensorReading) => boolean;
  label: string;
  recommendation: string;
  severity: number; // higher = more severe
}

const RULES: InterpretationRule[] = [
  {
    id: 'fermentation',
    condition: (r) => r.humidity > 17 && r.temperature > 28,
    label: 'Fermentación probable',
    recommendation: 'Inspección presencial inmediata requerida',
    severity: 90,
  },
  {
    id: 'biological_activity',
    condition: (r) => r.co2 > 800 && r.temperature > 26,
    label: 'Actividad biológica detectada',
    recommendation: 'Preparar sistema de aireación. Verificar en las próximas 6 horas',
    severity: 80,
  },
  {
    id: 'thermal_spike',
    condition: (r, prev) => prev !== undefined && r.temperature - prev.temperature > 3,
    label: 'Pico térmico detectado',
    recommendation: 'Inspección en la zona del sensor afectado',
    severity: 75,
  },
  {
    id: 'condensation',
    condition: (r) => r.humidity > 16 && r.temperature < 28,
    label: 'Condensación detectada',
    recommendation: 'Monitoreo reforzado. Verificar sellado de la silobolsa',
    severity: 60,
  },
  {
    id: 'high_co2',
    condition: (r) => r.co2 > 700 && r.temperature <= 26,
    label: 'CO₂ elevado',
    recommendation: 'Monitorear evolución en las próximas lecturas',
    severity: 50,
  },
  {
    id: 'high_humidity',
    condition: (r) => r.humidity > 14 && r.humidity <= 17,
    label: 'Humedad en ascenso',
    recommendation: 'Monitoreo preventivo. Posible ingreso de humedad externa',
    severity: 40,
  },
  {
    id: 'warm',
    condition: (r) => r.temperature > 28 && r.temperature <= 35,
    label: 'Temperatura elevada',
    recommendation: 'Vigilar evolución térmica en próximas lecturas',
    severity: 35,
  },
  {
    id: 'stable',
    condition: () => true, // fallback
    label: 'Condiciones estables',
    recommendation: 'Sin acción requerida. El grano se conserva correctamente',
    severity: 0,
  },
];

/**
 * Interpret sensor readings and produce a human-readable AI interpretation
 */
export function interpretReading(
  current: SensorReading,
  previous?: SensorReading
): AIInterpretation {
  const triggeredRules = RULES.filter((rule) =>
    rule.condition(current, previous)
  );

  // Take the highest severity match
  const primary = triggeredRules.reduce((a, b) =>
    a.severity > b.severity ? a : b
  );

  const factors: string[] = [];
  if (current.temperature > 28) factors.push(`Temperatura ${current.temperature.toFixed(1)}°C`);
  if (current.humidity > 14) factors.push(`Humedad ${current.humidity.toFixed(1)}%`);
  if (current.co2 > 600) factors.push(`CO₂ ${Math.round(current.co2)} ppm`);
  if (previous && current.temperature - previous.temperature > 2)
    factors.push(`ΔTemp +${(current.temperature - previous.temperature).toFixed(1)}°C`);

  return {
    summary: primary.label,
    recommendation: primary.recommendation,
    confidence: Math.min(95, 60 + primary.severity * 0.35),
    factors: factors.length > 0 ? factors : ['Todos los parámetros normales'],
  };
}

/**
 * Get the overall system interpretation based on all silos
 */
export function interpretSystem(silos: SiloBag[]): {
  summary: string;
  detail: string;
  state: 'ok' | 'warn' | 'critical';
} {
  const critical = silos.filter((s) => s.state === 'critical');
  const warning = silos.filter((s) => s.state === 'warn');
  const offline = silos.filter((s) => s.state === 'offline');

  if (critical.length > 0) {
    return {
      summary: `${critical.length} silobolsa${critical.length > 1 ? 's' : ''} en estado CRÍTICO`,
      detail: `${critical.map((s) => s.name).join(', ')} requiere${critical.length > 1 ? 'n' : ''} atención inmediata`,
      state: 'critical',
    };
  }

  if (warning.length > 0) {
    return {
      summary: `${warning.length} silobolsa${warning.length > 1 ? 's' : ''} en atención`,
      detail: `Monitoreo reforzado en ${warning.map((s) => s.name).join(', ')}`,
      state: 'warn',
    };
  }

  if (offline.length > 0) {
    return {
      summary: 'Sistema estable — sensores offline detectados',
      detail: `${offline.map((s) => s.name).join(', ')} sin datos recientes`,
      state: 'warn',
    };
  }

  return {
    summary: 'Sistema estable',
    detail: 'Todas las silobolsas operando dentro de parámetros normales',
    state: 'ok',
  };
}
