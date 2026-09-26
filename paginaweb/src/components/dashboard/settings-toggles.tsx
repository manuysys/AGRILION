'use client';

import { useState } from 'react';

interface ToggleItem {
  label: string;
  desc: string;
  enabled: boolean;
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`
        w-10 h-6 rounded-full relative cursor-pointer shrink-0
        transition-colors duration-200
        ${enabled ? 'bg-emerald-600' : 'bg-zinc-700'}
      `}
    >
      <span
        className={`
          absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${enabled ? 'translate-x-5' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

export function NotificationsCard() {
  const [items, setItems] = useState<ToggleItem[]>([
    { label: 'Alertas críticas', desc: 'Push inmediato', enabled: true },
    { label: 'Alertas de atención', desc: 'Cada 30 minutos', enabled: true },
    { label: 'Resumen diario', desc: 'Todos los días a las 8:00', enabled: true },
    { label: 'Sensor offline', desc: 'Después de 6 horas sin datos', enabled: false },
    { label: 'Batería baja', desc: 'Cuando baja del 20%', enabled: false },
  ]);

  function toggle(index: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item))
    );
  }

  return (
    <div className="rounded-2xl glass-dark border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-1">Notificaciones</h3>
      <p className="text-xs text-zinc-500 mb-4">
        Preferencias locales de esta sesión (el envío de notificaciones todavía no está implementado)
      </p>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-zinc-500">{item.desc}</p>
            </div>
            <ToggleSwitch enabled={item.enabled} onToggle={() => toggle(index)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DisplayCard() {
  const [fieldMode, setFieldMode] = useState(false);

  return (
    <div className="rounded-2xl glass-dark border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Pantalla</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div>
            <p className="text-sm font-medium text-white">Modo Campo</p>
            <p className="text-xs text-zinc-500">Alto contraste, texto 1.2×, sin animaciones</p>
          </div>
          <ToggleSwitch enabled={fieldMode} onToggle={() => setFieldMode((v) => !v)} />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-white">Frecuencia de actualización</p>
            <p className="text-xs text-zinc-500">
              El dashboard se actualiza al recargar la página
            </p>
          </div>
          <span className="font-data text-sm font-semibold text-white bg-white/5 px-3 py-1 rounded-lg">
            Al recargar
          </span>
        </div>
      </div>
    </div>
  );
}
