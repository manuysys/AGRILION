import type { Metadata } from 'next';
import Sidebar from '@/components/layout/sidebar';
import BottomNav from '@/components/layout/bottom-nav';
import DashboardHeader from '@/components/layout/dashboard-header';
import { fetchDashboardStats } from '@/lib/data-service';
import { formatRelativeTime } from '@/lib/formatters';

export const metadata: Metadata = {
  title: 'Dashboard | Agrilion+',
  description: 'Panel de monitoreo en tiempo real de silobolsas',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await fetchDashboardStats();

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          systemHealth={stats.systemHealth}
          lastUpdate={formatRelativeTime(stats.lastGlobalUpdate)}
          activeAlerts={stats.activeAlerts}
        />

        <main className="flex-1 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
