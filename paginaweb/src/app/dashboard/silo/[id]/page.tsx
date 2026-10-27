import { fetchSiloDetail } from '@/lib/data-service';
import { notFound } from 'next/navigation';
import SiloDetailClient from '@/components/dashboard/silo-detail-client';

// La ruta depende de la sesión del usuario; se renderiza en cada request.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const silo = await fetchSiloDetail(id);
  if (!silo) return { title: 'Silo no encontrado | Agrilion+' };

  return {
    title: `${silo.name} (${silo.id}) | Agrilion+`,
    description: `Monitoreo de ${silo.grainType} en ${silo.name} — ${silo.interpretation.summary}`,
  };
}

export default async function SiloDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const silo = await fetchSiloDetail(id);

  if (!silo) {
    notFound();
  }

  return <SiloDetailClient silo={silo} />;
}
