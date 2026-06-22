// Data service layer — abstracts mock vs API data sources

import type { SiloBag, Alert, DashboardStats } from '@/types';
import { mockSiloBags, mockAlerts, mockDashboardStats } from './mock-data';

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

// ── Dashboard Stats ──
export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (MOCK_MODE) return mockDashboardStats;

  // TODO: Fetch from API
  return mockDashboardStats;
}

// ── Silo Bags ──
export async function fetchSilobags(): Promise<SiloBag[]> {
  if (MOCK_MODE) {
    // Sort by risk score (descending) for ranking
    return [...mockSiloBags].sort((a, b) => b.riskScore.value - a.riskScore.value);
  }

  // TODO: Fetch from API
  return mockSiloBags;
}

// ── Single Silo Detail ──
export async function fetchSiloDetail(id: string): Promise<SiloBag | null> {
  if (MOCK_MODE) {
    return mockSiloBags.find((s) => s.id === id) ?? null;
  }

  // TODO: Fetch from API
  return null;
}

// ── Alerts ──
export async function fetchAlerts(filter?: {
  severity?: string;
  siloId?: string;
  acknowledged?: boolean;
}): Promise<Alert[]> {
  if (MOCK_MODE) {
    let alerts = [...mockAlerts];

    if (filter?.severity) {
      alerts = alerts.filter((a) => a.severity === filter.severity);
    }
    if (filter?.siloId) {
      alerts = alerts.filter((a) => a.siloId === filter.siloId);
    }
    if (filter?.acknowledged !== undefined) {
      alerts = alerts.filter((a) => a.acknowledged === filter.acknowledged);
    }

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return alerts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  // TODO: Fetch from API
  return mockAlerts;
}

// ── Most Critical Silo ──
export async function fetchMostCriticalSilo(): Promise<SiloBag | null> {
  const silos = await fetchSilobags();
  const critical = silos.filter((s) => s.state === 'critical');
  if (critical.length > 0) return critical[0];

  const warning = silos.filter((s) => s.state === 'warn');
  if (warning.length > 0) return warning[0];

  return silos[0] ?? null;
}
