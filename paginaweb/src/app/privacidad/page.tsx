import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Agrilion+',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <Link href="/" className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
          ← Volver al inicio
        </Link>
        <h1 className="text-4xl font-black tracking-tight">Política de Privacidad</h1>
        <p className="text-zinc-400">
          Agrilion almacena los datos de sensores (temperatura, humedad y CO₂) en
          InfluxDB y los datos de cuenta y silobolsas en Firebase (Google). No se
          comparten con terceros fuera del proyecto.
        </p>
        <p className="text-zinc-400">
          Para solicitar la eliminación de tus datos, escribinos a{' '}
          <a href="mailto:eest4.74.agrilion@gmail.com" className="text-emerald-500 hover:text-emerald-400">
            eest4.74.agrilion@gmail.com
          </a>.
        </p>
        <p className="text-sm text-zinc-600">
          Documento en elaboración — última actualización: 2026.
        </p>
      </div>
    </div>
  );
}
