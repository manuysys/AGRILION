import type { Metadata } from 'next';
import Sidebar from '@/components/layout/sidebar';
import BottomNav from '@/components/layout/bottom-nav';
import DashboardHeader from '@/components/layout/dashboard-header';
import { fetchDashboardStats } from '@/lib/data-service';
import { formatRelativeTime } from '@/lib/formatters';
import PageTransition from '@/components/ui/page-transition';

export const metadata: Metadata = {
  title: 'Dashboard | Agrilion+',
  description: 'Panel de monitoreo en tiempo real de silobolsas',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch stats con fallback seguro (si falla, usar defaults)
  let stats;
  try {
    stats = await fetchDashboardStats();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    stats = {
      totalSilos: 0,
      activeSensors: 0,
      totalSensors: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      averageBattery: 0,
      lastGlobalUpdate: new Date().toISOString(),
      systemHealth: 'ok' as const,
    };
  }

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          systemHealth={stats.systemHealth}
          lastUpdate={formatRelativeTime(stats.lastGlobalUpdate)}
          activeAlerts={stats.activeAlerts}
        />

        <main className="flex-1 pb-20 lg:pb-6 relative">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
