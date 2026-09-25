import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuración | Agrilion+',
  description: 'Configuración del sistema de monitoreo',
};

export default function SettingsPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Configuración
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Ajustes del sistema de monitoreo y notificaciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thresholds */}
        <div className="rounded-2xl glass-dark border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Umbrales de Alerta
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Temperatura (advertencia)', value: '28°C', desc: 'Se genera alerta de atención' },
              { label: 'Temperatura (crítica)', value: '35°C', desc: 'Se genera alerta crítica' },
              { label: 'Humedad (advertencia)', value: '14%', desc: 'Monitoreo reforzado' },
              { label: 'Humedad (crítica)', value: '17%', desc: 'Riesgo de fermentación' },
              { label: 'CO₂ (advertencia)', value: '600 ppm', desc: 'Actividad biológica posible' },
              { label: 'CO₂ (crítica)', value: '800 ppm', desc: 'Actividad biológica confirmada' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <span className="font-data text-sm font-semibold text-white bg-white/5 px-3 py-1 rounded-lg">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl glass-dark border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Notificaciones
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Alertas críticas', desc: 'Push inmediato', enabled: true },
              { label: 'Alertas de atención', desc: 'Cada 30 minutos', enabled: true },
              { label: 'Resumen diario', desc: 'Todos los días a las 8:00', enabled: true },
              { label: 'Sensor offline', desc: 'Después de 6 horas sin datos', enabled: false },
              { label: 'Batería baja', desc: 'Cuando baja del 20%', enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <div
                  className={`
                    w-10 h-6 rounded-full relative cursor-pointer
                    transition-colors duration-200
                    ${item.enabled ? 'bg-emerald-600' : 'bg-zinc-700'}
                  `}
                >
                  <div
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm
                      transition-transform duration-200
                      ${item.enabled ? 'translate-x-5' : 'translate-x-1'}
                    `}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="rounded-2xl glass-dark border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Pantalla
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="text-sm font-medium text-white">Modo Campo</p>
                <p className="text-xs text-zinc-500">Alto contraste, texto 1.2×, sin animaciones</p>
              </div>
              <div className="w-10 h-6 rounded-full relative cursor-pointer bg-zinc-700">
                <div className="absolute top-1 translate-x-1 w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white">Frecuencia de actualización</p>
                <p className="text-xs text-zinc-500">Intervalo de polling del dashboard</p>
              </div>
              <span className="font-data text-sm font-semibold text-white bg-white/5 px-3 py-1 rounded-lg">
                30 seg
              </span>
            </div>
          </div>
        </div>

        {/* System info */}
        <div className="rounded-2xl glass-dark border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Información del Sistema
          </h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Versión', value: 'Agrilion+ v2.0.0 (Demo)' },
              { label: 'Modo', value: 'Demo — datos simulados' },
              { label: 'Backend', value: 'Mock data (local)' },
              { label: 'ML Pipeline', value: 'LSTM + Risk Engine' },
              { label: 'Conectividad', value: 'LoRa → TTN → MQTT' },
              { label: 'Autor', value: 'Juan Manuel Iglesias' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-zinc-500">{item.label}</span>
                <span className="font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
