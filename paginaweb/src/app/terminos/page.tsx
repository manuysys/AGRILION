import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de Agrilion+',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <Link href="/" className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
          ← Volver al inicio
        </Link>
        <h1 className="text-4xl font-black tracking-tight">Términos y Condiciones</h1>
        <p className="text-zinc-400">
          Agrilion es un sistema de monitoreo de silobolsas en etapa de prototipo.
          Los datos mostrados son experimentales y no reemplazan la inspección
          profesional del grano almacenado.
        </p>
        <p className="text-zinc-400">
          El uso del servicio es bajo responsabilidad del usuario. Para consultas,
          escribinos a{' '}
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
