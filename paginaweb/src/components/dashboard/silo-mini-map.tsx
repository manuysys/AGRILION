'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Crosshair, MapPin, Satellite } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import type { SiloBag } from '@/types';
import { buildGpsMarkerIcon, createDarkMap, markerColor } from './leaflet-shared';
import { formatRelativeMinutes } from '@/lib/formatters';

/**
 * Mini-mapa del detalle de silo: un solo marcador en las coordenadas GPS del
 * silo + card de estado del fix (satélites, HDOP, antigüedad). Si el silo no
 * tiene coordenadas muestra un placeholder explicativo en lugar del mapa.
 */
export default function SiloMiniMap({ silo }: { silo: SiloBag }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);

  const lat = silo.coordinates?.latitude ?? null;
  const lng = silo.coordinates?.longitude ?? null;
  const markerState = silo.state;
  const gps = silo.gps ?? null;
  const currentFix = gps?.currentFix ?? false;

  useEffect(() => {
    if (lat === null || lng === null) return;

    let cancelled = false;
    let map: LeafletMap | null = null;

    async function renderMiniMap() {
      try {
        const handle = await createDarkMap(containerRef.current!);
        if (cancelled) {
          handle.map.remove();
          return;
        }
        map = handle.map;

        handle.L.marker([lat!, lng!], {
          icon: buildGpsMarkerIcon(handle.L, {
            color: markerColor(markerState),
            currentFix,
          }),
        }).addTo(map);

        map.setView([lat!, lng!], 16);
        window.setTimeout(() => map?.invalidateSize(), 120);
      } catch {
        if (!cancelled) setMapError(true);
      }
    }

    void renderMiniMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, markerState, currentFix]);

  const statusBadge = currentFix
    ? {
        label: 'Fix actual',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        pulse: true,
      }
    : gps?.hasFix
      ? {
          label: 'Última posición conocida',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          pulse: false,
        }
      : {
          label: 'Sin fix GPS',
          className: 'bg-white/5 text-zinc-400 border-white/10',
          dot: 'bg-zinc-500',
          pulse: false,
        };

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Satélites', value: gps?.satellites != null ? String(gps.satellites) : '—' },
    { label: 'Precisión (HDOP)', value: gps?.hdop != null ? gps.hdop.toFixed(1) : '—' },
    {
      label: 'Antigüedad del fix',
      value: gps?.ageMin != null ? formatRelativeMinutes(gps.ageMin) : '—',
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-emerald-400" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-white">Ubicación GPS</h3>
          <span className="font-data text-[11px] text-zinc-500 hidden sm:inline">
            {silo.location}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}
        >
          <span className="relative flex w-1.5 h-1.5">
            {statusBadge.pulse && (
              <span
                className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
                aria-hidden="true"
              />
            )}
            <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
          </span>
          {statusBadge.label}
        </span>
      </div>

      {lat !== null && lng !== null ? (
        <div className="relative rounded-xl overflow-hidden border border-white/5 bg-zinc-900">
          <div ref={containerRef} className="h-[240px] w-full" />
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 text-center">
              <p className="text-xs text-zinc-400">
                No se pudo cargar el mapa (sin conexión con OpenStreetMap).
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-[240px] rounded-xl border border-dashed border-white/10 bg-zinc-900/60 flex flex-col items-center justify-center text-center px-6">
          <MapPin size={28} className="text-zinc-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white">Sin posición GPS</p>
          <p className="mt-1 text-xs text-zinc-500 max-w-[280px]">
            El Air530Z necesita vista al cielo para fijar posición. La ubicación
            aparecerá con el primer fix del receptor.
          </p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white/5 border border-white/5 px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              {stat.label === 'Satélites' ? (
                <Satellite size={11} aria-hidden="true" />
              ) : stat.label.startsWith('Precisión') ? (
                <Crosshair size={11} aria-hidden="true" />
              ) : (
                <Clock size={11} aria-hidden="true" />
              )}
              {stat.label}
            </p>
            <p className="font-data text-sm font-semibold text-white mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
