// Human-readable formatters for sensor data and timestamps

/**
 * Format a relative time string in Spanish
 * e.g. "hace 2 min", "hace 3 h", "hace 2 días"
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'hace unos segundos';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHr < 24) return `hace ${diffHr} h`;
  if (diffDays === 1) return 'hace 1 día';
  return `hace ${diffDays} días`;
}

/**
 * Get freshness color class based on how old the data is
 */
export function getFreshnessColor(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffHr = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffHr < 2) return 'text-gray-500';   // fresh
  if (diffHr < 4) return 'text-amber-500';  // getting old
  if (diffHr < 6) return 'text-orange-500'; // stale
  return 'text-red-500';                     // very stale
}

/**
 * Format temperature with unit
 */
export function formatTemp(value: number): string {
  return `${value.toFixed(1)}°C`;
}

/**
 * Format humidity with unit
 */
export function formatHumidity(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format CO2 with unit
 */
export function formatCO2(value: number): string {
  return `${Math.round(value)} ppm`;
}

/**
 * Format risk score
 */
export function formatRiskScore(value: number): string {
  return `${Math.round(value)}/100`;
}

/**
 * Format battery percentage
 */
export function formatBattery(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Calculate delta between current and previous value
 */
export function formatDelta(current: number, previous: number | undefined): string {
  if (previous === undefined) return '';
  const diff = current - previous;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}`;
}

/**
 * Get trend arrow based on delta
 */
export function getTrendArrow(current: number, previous: number | undefined): string {
  if (previous === undefined) return '';
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return '→';
  if (diff > 2) return '↑↑';
  if (diff > 0) return '↑';
  if (diff < -2) return '↓↓';
  return '↓';
}

/**
 * Format a date for chart axis
 */
export function formatChartTime(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Format a full date in Spanish
 */
export function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
