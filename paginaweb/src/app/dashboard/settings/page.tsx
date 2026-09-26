import type { Metadata } from 'next';
import { DeviceSetup } from '@/components/dashboard/device-setup';
import { NotificationsCard, DisplayCard } from '@/components/dashboard/settings-toggles';
import { THRESHOLDS } from '@/lib/thresholds';

export const metadata: Metadata = {
  title: 'Configuración | Agrilion+',
  description: 'Configuración del sistema de monitoreo',
};

export default function SettingsPage() {
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

  const thresholdItems = [
    {
      label: 'Temperatura (advertencia)',
      value: `${THRESHOLDS.temperature.warning.min}${THRESHOLDS.temperature.unit}`,
      desc: 'Se genera alerta de atención',
    },
    {
      label: 'Temperatura (crítica)',
      value: `${THRESHOLDS.temperature.critical.min}${THRESHOLDS.temperature.unit}`,
      desc: 'Se genera alerta crítica',
    },
    {
      label: 'Humedad (advertencia)',
      value: `${THRESHOLDS.humidity.warning.min}${THRESHOLDS.humidity.unit}`,
      desc: 'Monitoreo reforzado',
    },
    {
      label: 'Humedad (crítica)',
      value: `${THRESHOLDS.humidity.critical.min}${THRESHOLDS.humidity.unit}`,
      desc: 'Riesgo de fermentación',
    },
    {
      label: 'CO₂ (advertencia)',
      value: `${THRESHOLDS.co2.warning.min} ${THRESHOLDS.co2.unit}`,
      desc: 'Actividad biológica posible',
    },
    {
      label: 'CO₂ (crítica)',
      value: `${THRESHOLDS.co2.critical.min} ${THRESHOLDS.co2.unit}`,
      desc: 'Actividad biológica confirmada',
    },
  ];

  const systemInfo = [
    { label: 'Versión', value: 'Agrilion+ v2.0.0' },
    {
      label: 'Modo',
      value: mockMode ? 'Demo — datos simulados' : 'Producción — datos reales',
    },
    {
      label: 'Backend',
      value: mockMode ? 'Mock data (local)' : 'AI API + InfluxDB + Firebase',
    },
    { label: 'ML Pipeline', value: 'LSTM + Risk Engine' },
    { label: 'Conectividad', value: 'LoRa → TTN → MQTT' },
    { label: 'Autor', value: 'Juan Manuel Iglesias' },
  ];

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

      <DeviceSetup />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thresholds */}
        <div className="rounded-2xl glass-dark border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Umbrales de Alerta
          </h3>
          <div className="space-y-4">
            {thresholdItems.map((item) => (
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

        <NotificationsCard />

        <DisplayCard />

        {/* System info */}
        <div className="rounded-2xl glass-dark border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Información del Sistema
          </h3>
          <div className="space-y-3 text-sm">
            {systemInfo.map((item) => (
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
