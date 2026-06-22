import { fetchSiloDetail, fetchSilobags } from '@/lib/data-service';
import { notFound } from 'next/navigation';
import SiloDetailClient from '@/components/dashboard/silo-detail-client';

// Generate static params for all silos
export async function generateStaticParams() {
  const silos = await fetchSilobags();
  return silos.map((silo) => ({ id: silo.id }));
}

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
