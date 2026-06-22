import { fetchSilobags, fetchAlerts } from '@/lib/data-service';
import IAClient from '@/components/dashboard/ia-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Centro IA | Agrilion+',
  description: 'Análisis inteligente y recomendaciones del sistema de monitoreo',
};

export default async function IAPage() {
  const [silos, alerts] = await Promise.all([fetchSilobags(), fetchAlerts()]);

  return <IAClient silos={silos} alerts={alerts} />;
}
