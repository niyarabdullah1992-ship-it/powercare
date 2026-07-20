import React, { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import ExecKpiCards from "@/components/executive/ExecKpiCards";
import ExecStationsMap from "@/components/executive/ExecStationsMap";
import ExecStationTable from "@/components/executive/ExecStationTable";

// Executive Dashboard — one screen for top management: all stations on a live map,
// company-wide KPIs, and a per-station health table.
export default function ExecutiveDashboard() {
  const { lang } = useI18n();
  const { data } = useAuth();
  const ar = lang === "ar";

  const { stats, stationRows } = useMemo(() => {
    const stations = data?.stations || [];
    const employees = data?.employees || [];
    const tasks = data?.tasks || [];
    const safety = data?.safety || [];
    const reports = data?.reports || [];
    const complaints = [...(data?.anonymousReports || []), ...(data?.publicReports || [])];

    const doneTasks = tasks.filter((t) => t.status === "completed").length;
    const openStatuses = new Set(["open", "in_review"]);
    const stats = {
      stations: stations.length,
      activeStations: stations.filter((s) => s.status === "active").length,
      employees: employees.length,
      managers: employees.filter((e) => ["director", "ops_manager", "pgm", "station_manager"].includes(e.role)).length,
      taskCompletion: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0,
      activeTasks: tasks.filter((t) => t.status === "in_progress").length,
      openComplaints: complaints.filter((c) => openStatuses.has(c.status)).length,
      safetyRed: safety.filter((s) => s.level === "red").length,
      safetyAmber: safety.filter((s) => s.level === "amber").length,
      pendingReports: reports.filter((r) => r.status === "pending").length,
    };

    const stationRows = stations.map((s) => {
      const stTasks = tasks.filter((t) => t.stationId === s.id);
      const stDone = stTasks.filter((t) => t.status === "completed").length;
      return {
        id: s.id,
        name: s.name,
        location: s.location || "",
        manager: employees.find((e) => e.id === s.managerId)?.name || null,
        staff: employees.filter((e) => e.stationId === s.id).length,
        activeTasks: stTasks.filter((t) => t.status === "in_progress").length,
        completion: stTasks.length ? Math.round((stDone / stTasks.length) * 100) : 0,
        openComplaints: complaints.filter((c) => c.stationId === s.id && openStatuses.has(c.status)).length,
        safety: safety.find((r) => r.stationId === s.id)?.level || "none",
      };
    });
    return { stats, stationRows };
  }, [data]);

  return (
    <div className="ops-command-dashboard space-y-5">
      <header className="ops-command-header">
        <p className="ops-eyebrow">PowerCare / {ar ? "القيادة التنفيذية" : "Executive Command"}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">{ar ? "اللوحة التنفيذية" : "Executive Dashboard"}</h1>
        <p className="mt-2 max-w-2xl text-sm font-body text-white/60">
          {ar ? "نظرة شاملة لحظية على جميع المحطات والفرق ومؤشرات الأداء" : "A live, company-wide view of every station, team and KPI"}
        </p>
      </header>
      <ExecKpiCards stats={stats} lang={lang} />
      <ExecStationsMap stations={data?.stations || []} safety={data?.safety || []} lang={lang} />
      <ExecStationTable rows={stationRows} lang={lang} />
    </div>
  );
}