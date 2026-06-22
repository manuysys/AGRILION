import { fetchAlerts } from '@/lib/data-service';
import AlertsClient from '@/components/dashboard/alerts-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alertas | Agrilion+',
  description: 'Bandeja de alertas del sistema de monitoreo de silobolsas',
};

export default async function AlertsPage() {
  const alerts = await fetchAlerts();

  return <AlertsClient alerts={alerts} />;
}
