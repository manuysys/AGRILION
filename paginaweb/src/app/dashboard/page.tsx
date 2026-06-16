"use client";

import { useState, useEffect } from "react";
import { SiloBag, SiloBagDetail, DashboardStats, Alert } from "@/types";
import { getSiloBagDetail } from "@/lib/mockData";
import {
  fetchDashboardStats,
  fetchSilobags,
  fetchAlerts,
  fetchSiloDetail,
} from "@/lib/data-service";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import SiloBagList from "@/components/dashboard/SiloBagList";
import SiloBagDetailView from "@/components/dashboard/SiloBagDetail";
import AlertPanel from "@/components/dashboard/AlertPanel";
import AIAnalysis from "@/components/dashboard/AIAnalysis";

type Tab = "resumen" | "silobolsas" | "alertas" | "ia";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [selectedSiloBag, setSelectedSiloBag] = useState<SiloBagDetail | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [silobags, setSilobags] = useState<SiloBag[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetchDashboardStats(),
      fetchSilobags(),
      fetchAlerts(),
    ]).then(([s, b, a]) => {
      if (!mounted) return;
      setStats(s);
      setSilobags(b);
      setAlerts(a);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  const handleSelectBag = async (id: string) => {
    const detail = await fetchSiloDetail(id);
    if (detail) {
      setSelectedSiloBag(detail);
      setActiveTab("silobolsas");
    }
  };

  const handleCloseDetail = () => {
    setSelectedSiloBag(null);
  };

  if (loading) {
    return (
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#1a5c3a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Cargando datos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "resumen" && (
        <DashboardOverview
          stats={stats!}
          silobags={silobags}
          alerts={alerts}
          onSelectBag={handleSelectBag}
        />
      )}

      {activeTab === "silobolsas" && (
        <div className="space-y-6">
          <SiloBagList
            silobags={silobags}
          />
          {selectedSiloBag && (
            <SiloBagDetailView
              detail={selectedSiloBag}
              onClose={handleCloseDetail}
            />
          )}
        </div>
      )}

      {activeTab === "alertas" && (
        <AlertPanel alerts={alerts} onSelectBag={handleSelectBag} />
      )}

      {activeTab === "ia" && (
        <AIAnalysis
          silobags={silobags}
          getDetail={getSiloBagDetail}
        />
      )}
    </DashboardLayout>
  );
}
