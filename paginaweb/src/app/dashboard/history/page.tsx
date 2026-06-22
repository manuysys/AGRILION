import { fetchSilobags } from '@/lib/data-service';
import HistoryClient from '@/components/dashboard/history-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Histórico | Agrilion+',
  description: 'Datos históricos de sensores de silobolsas',
};

export default async function HistoryPage() {
  const silos = await fetchSilobags();

  return <HistoryClient silos={silos} />;
}
