import { fetchSilobags, fetchDashboardStats, fetchAlerts } from '@/lib/data-service';
import { interpretSystem } from '@/lib/interpretation';
import DashboardHero from '@/components/dashboard/dashboard-hero';
import DashboardStats from '@/components/dashboard/dashboard-stats';
import RiskRanking from '@/components/dashboard/risk-ranking';
import RecentAlerts from '@/components/dashboard/recent-alerts';

export default async function DashboardPage() {
  const [silos, stats, alerts] = await Promise.all([
    fetchSilobags(),
    fetchDashboardStats(),
    fetchAlerts(),
  ]);

  const systemInterpretation = interpretSystem(silos);
  const mostCritical = silos.find((s) => s.state === 'critical') ?? silos[0];
  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
      {/* Hero Status — 40% viewport */}
      <DashboardHero
        systemState={systemInterpretation.state}
        summary={systemInterpretation.summary}
        detail={systemInterpretation.detail}
        criticalSilo={mostCritical}
      />

      {/* Quick Stats */}
      <DashboardStats stats={stats} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Risk Ranking — 2/3 */}
        <div className="xl:col-span-2">
          <RiskRanking silos={silos} />
        </div>

        {/* Recent Alerts — 1/3 */}
        <div>
          <RecentAlerts alerts={activeAlerts.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}
