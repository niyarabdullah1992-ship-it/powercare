import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { getRoleLabel } from "@/lib/roles";
import { Trophy } from "lucide-react";
import PerformanceOverview from "@/components/performance/PerformanceOverview";
import PerformanceComparison from "@/components/performance/PerformanceComparison";
import PerformanceTrends from "@/components/performance/PerformanceTrends";
import SupervisionFairness from "@/components/performance/SupervisionFairness";
import EmployeeReportModal from "@/components/performance/EmployeeReportModal";

export default function Performance() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [view, setView] = useState("overview");
  const [reportId, setReportId] = useState(null);
  const ar = lang === "ar";

  if (!data || !currentUser) return null;

  const defaultStationId = data.stations?.[0]?.id || null;
  const stationName = (id) => data.stations.find((s) => s.id === (id || defaultStationId))?.name || "—";
  const roleLabel = (e) => e.customTitle || getRoleLabel(company, e.role, t);

  const isManager = currentUser.role !== "employee";
  const scopedEmployees = isManager
    ? data.employees
    : data.employees.filter((e) => (e.stationId || defaultStationId) === (currentUser.stationId || defaultStationId));

  const ranked = [...scopedEmployees]
    .map((e) => ({ ...e, points: e.points || 0 }))
    .sort((a, b) => b.points - a.points);

  const stationTotals = data.stations
    .map((s) => {
      const members = data.employees.filter((e) => (e.stationId || defaultStationId) === s.id);
      return { ...s, points: members.reduce((sum, e) => sum + (e.points || 0), 0), memberCount: members.length };
    })
    .sort((a, b) => b.points - a.points);

  const tabs = [
    { key: "overview", label: ar ? "النظرة العامة" : "Overview" },
    { key: "comparison", label: ar ? "المقارنة" : "Comparison" },
    ...(isManager ? [
      { key: "trends", label: ar ? "الاتجاهات" : "Trends" },
      { key: "supervision", label: ar ? "الإشراف والعدالة" : "Supervision & fairness" },
    ] : []),
  ];

  return (
    <div className="performance-hub space-y-6">
      <div className="performance-hub-header flex flex-wrap items-center justify-between gap-5">
        <div className="performance-hub-title">
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold">
            <Trophy className="h-6 w-6" /> {t("performance")}
          </h1>
          {!isManager && (
            <p className="mt-1 text-sm text-muted-foreground font-body">
              {t("myStation")}: {stationName(currentUser.stationId || defaultStationId)}
            </p>
          )}
        </div>
        <div className="performance-hub-tabs flex items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-body transition ${view === tab.key ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === "overview" && (
        <PerformanceOverview
          t={t}
          ar={ar}
          company={company}
          ranked={ranked}
          stationTotals={stationTotals}
          stationName={stationName}
          roleLabel={roleLabel}
          currentUserId={currentUser.id}
          onSelectEmployee={setReportId}
        />
      )}
      {view === "comparison" && <PerformanceComparison t={t} ar={ar} canCompareUnits={isManager} />}
      {view === "trends" && isManager && <PerformanceTrends />}
      {view === "supervision" && isManager && <SupervisionFairness />}

      {reportId && <EmployeeReportModal employeeId={reportId} t={t} onClose={() => setReportId(null)} />}
    </div>
  );
}