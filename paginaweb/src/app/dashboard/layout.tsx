import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import BottomNav from '@/components/layout/bottom-nav';
import DashboardHeader from '@/components/layout/dashboard-header';
import DataStatusBanner from '@/components/dashboard/data-status-banner';
import SessionRefresh from '@/components/auth/session-refresh';
import { fetchDashboardStats, IS_DEMO_MODE } from '@/lib/data-service';
import { checkHealth } from '@/lib/ai-api';
import { getSessionToken } from '@/lib/session-server';
import { formatRelativeTime } from '@/lib/formatters';
import PageTransition from '@/components/ui/page-transition';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'Dashboard | Agrilion+',
  description: 'Panel de monitoreo en tiempo real de silobolsas',
};

// Dashboard siempre renderizado en el servidor con datos frescos
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El modo demo es público; el modo real exige una sesión de Firebase.
  const sessionToken = await getSessionToken();
  if (!IS_DEMO_MODE && !sessionToken) {
    redirect('/login');
  }

  // Stats y health en paralelo con fallback seguro.
  const statsPromise = fetchDashboardStats().catch((error) => {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalSilos: 0,
      activeSensors: 0,
      totalSensors: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      averageBattery: 0,
      lastGlobalUpdate: new Date(0).toISOString(),
      systemHealth: 'warn' as const,
    };
  });
  const healthPromise = IS_DEMO_MODE
    ? Promise.resolve(true)
    : checkHealth().then(Boolean);

  const [stats, apiOnline] = await Promise.all([statsPromise, healthPromise]);

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <SessionRefresh enabled={!IS_DEMO_MODE} />
      <Sidebar alertCount={stats.activeAlerts} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          systemHealth={stats.systemHealth}
          lastUpdate={formatRelativeTime(stats.lastGlobalUpdate)}
          activeAlerts={stats.activeAlerts}
        />

        <main className="flex-1 pb-20 lg:pb-6 relative">
          <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 lg:px-6">
            <DataStatusBanner
              stats={stats}
              isDemo={IS_DEMO_MODE}
              apiOnline={apiOnline}
            />
          </div>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      <BottomNav alertCount={stats.activeAlerts} />
    </div>
  );
}
