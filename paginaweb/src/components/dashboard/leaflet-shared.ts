// Utilidades compartidas por los mapas Leaflet del dashboard
// (silo-map.tsx y silo-mini-map.tsx). Centraliza la carga SSR-safe de Leaflet,
// el estilo oscuro de tiles (sin API key) y el armado de marcadores GPS.

import type { Map as LeafletMap, DivIcon } from 'leaflet';
import type { HealthState, SiloGpsStatus } from '@/types';
import { formatRelativeMinutes } from '@/lib/formatters';

type LeafletModule = typeof import('leaflet');

export interface DarkMapHandle {
  map: LeafletMap;
  L: LeafletModule;
}

/**
 * Crea un mapa Leaflet con tiles OSM y tema oscuro (filtro CSS aplicado solo
 * al pane de tiles: marcadores y popups conservan sus colores).
 */
export async function createDarkMap(container: HTMLElement): Promise<DarkMapHandle> {
  const L = (await import('leaflet')).default;

  const map = L.map(container, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19,
  }).addTo(map);

  const tilePane = map.getPane('tilePane');
  if (tilePane) {
    tilePane.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.86) contrast(0.9)';
  }

  return { map, L };
}

export function markerColor(state: HealthState): string {
  if (state === 'critical') return '#ef4444';
  if (state === 'warn') return '#f59e0b';
  if (state === 'offline') return '#71717a';
  return '#10b981';
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[char] ?? char;
  });
}

/**
 * Marcador circular con estado GPS:
 * - fix actual → punto normal + anillo pulsante
 * - última posición conocida → mismo punto atenuado (sin pulso)
 */
export function buildGpsMarkerIcon(
  L: LeafletModule,
  options: { color: string; currentFix: boolean }
): DivIcon {
  const pulse = options.currentFix
    ? `<span class="agrilion-map-pulse" aria-hidden="true" style="position:absolute;inset:-7px;border-radius:9999px;border:2px solid ${options.color};"></span>`
    : '';
  const opacity = options.currentFix ? '1' : '0.55';

  return L.divIcon({
    className: 'agrilion-map-marker',
    html: `<span style="position:relative;display:block;width:16px;height:16px;opacity:${opacity};">${pulse}<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${options.color};border:3px solid #09090b;box-shadow:0 0 0 2px ${options.color}55, 0 0 18px ${options.color}88;"></span></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/**
 * Estado GPS en texto para popups y cards:
 * "Posición actual" · "Última posición hace X min" · "Última posición conocida".
 */
export function gpsStatusLabel(gps?: SiloGpsStatus | null): string | null {
  if (!gps) return null;
  if (gps.currentFix) return 'Posición actual';
  if (typeof gps.ageMin === 'number' && gps.ageMin >= 0) {
    return `Última posición ${formatRelativeMinutes(gps.ageMin)}`;
  }
  if (gps.hasFix) return 'Última posición conocida';
  return null;
}
