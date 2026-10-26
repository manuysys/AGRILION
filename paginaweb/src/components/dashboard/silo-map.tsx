'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Lock, MapPin } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import { auth } from '@/lib/firebase';
import type { SiloBag } from '@/types';

function escapeHtml(value: string): string {
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

function markerColor(state: SiloBag['state']): string {
  if (state === 'critical') return '#ef4444';
  if (state === 'warn') return '#f59e0b';
  if (state === 'offline') return '#71717a';
  return '#10b981';
}

export default function SiloMap({ silos }: { silos: SiloBag[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => setUser(nextUser));
  }, []);

  useEffect(() => {
    if (user === undefined || !user) return;

    let cancelled = false;
    let map: LeafletMap | null = null;

    async function renderMap() {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          subdomains: 'abc',
          maxZoom: 19,
        }
      ).addTo(map);

      // Estilo oscuro sin API key. El filtro se aplica solo al pane de tiles,
      // no a los marcadores ni a los popups.
      const tilePane = map.getPane('tilePane');
      if (tilePane) {
        tilePane.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.86) contrast(0.9)';
      }

      const withGps = silos.filter(
        (silo) =>
          typeof silo.coordinates?.latitude === 'number' &&
          typeof silo.coordinates?.longitude === 'number'
      );

      if (withGps.length === 0) {
        map.setView([-34.6037, -58.3816], 4);
        return;
      }

      withGps.forEach((silo) => {
        const coordinates = silo.coordinates!;
        const color = markerColor(silo.state);
        const icon = L.divIcon({
          className: 'agrilion-map-marker',
          html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid #09090b;box-shadow:0 0 0 2px ${color}55, 0 0 18px ${color}88;"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const popup = `
          <div style="min-width:210px;font-family:system-ui,sans-serif;background:#18181b;color:#fff;border-radius:10px;padding:2px 0;">
            <div style="font-weight:800;font-size:14px;margin-bottom:2px;">${escapeHtml(silo.name)}</div>
            <div style="font-size:11px;color:#a1a1aa;margin-bottom:8px;">${escapeHtml(silo.id)} · ${escapeHtml(silo.grainType)}</div>
            <div style="font-size:12px;line-height:1.7;">
              Riesgo: <strong>${silo.riskScore.value}/100</strong><br/>
              T: ${silo.currentReading.temperature.toFixed(1)} °C · H: ${silo.currentReading.humidity.toFixed(1)}%<br/>
              CO₂: ${Math.round(silo.currentReading.co2)} ppm
            </div>
            <a href="/dashboard/silo/${encodeURIComponent(silo.id)}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#34d399;">Ver detalle →</a>
          </div>
        `;

        L.marker(
          [coordinates.latitude, coordinates.longitude],
          { icon }
        ).bindPopup(popup).addTo(map!);
      });

      if (withGps.length === 1) {
        map.setView(
          [withGps[0].coordinates!.latitude, withGps[0].coordinates!.longitude],
          15
        );
      } else {
        const bounds = L.latLngBounds(
          withGps.map((silo) => [
            silo.coordinates!.latitude,
            silo.coordinates!.longitude,
          ])
        );
        map.fitBounds(bounds.pad(0.25), { maxZoom: 15 });
      }

      window.setTimeout(() => map?.invalidateSize(), 120);
    }

    void renderMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [silos, user]);

  if (user === undefined) {
    return (
      <div className="rounded-3xl border border-white/5 glass-dark p-6 text-sm text-zinc-500">
        Verificando sesión para cargar el mapa...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-white/5 glass-dark p-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <Lock size={20} className="text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-white">Mapa de ubicaciones</p>
          <p className="text-sm text-zinc-400">
            Iniciá sesión para ver la ubicación exacta de tus silos.{' '}
            <Link href="/login" className="text-emerald-400 font-semibold">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const withGpsCount = silos.filter((silo) => silo.coordinates).length;

  return (
    <div className="rounded-3xl border border-white/5 glass-dark p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-2 pb-3">
        <div className="flex items-center gap-2">
          <MapPin size={19} className="text-emerald-400" />
          <div>
            <h2 className="font-bold text-white tracking-tight">Mapa de silos</h2>
            <p className="text-[11px] text-zinc-500">
              {withGpsCount > 0
                ? `${withGpsCount} silo(s) con posición GPS`
                : 'Esperando la primera posición GPS'}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-zinc-600 font-data">OpenStreetMap</span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-zinc-900">
        <div ref={containerRef} className="h-[360px] w-full" />
        {withGpsCount === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 px-6 text-center">
            <div>
              <MapPin size={30} className="mx-auto text-zinc-500" />
              <p className="mt-2 text-sm font-semibold text-white">Todavía no hay GPS</p>
              <p className="mt-1 text-xs text-zinc-400">
                El Air530Z necesita vista al cielo para fijar posición.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
