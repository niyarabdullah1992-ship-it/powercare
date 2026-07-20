import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canSeeAllStations, visibleEmployees, canApproveReports, canReplyAnon, isCompanyOwner } from "@/lib/permissions";
import TeamStatusPanel from "@/components/dashboard/TeamStatusPanel";
import WelcomeHero from "@/components/dashboard/WelcomeHero";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import { AlertTriangle, FileText, Bell, Megaphone, Palette } from "lucide-react";
import DashboardStatCards from "@/components/dashboard/DashboardStatCards";
import AttendanceTrendChart from "@/components/dashboard/AttendanceTrendChart";
import StationsMapCard from "@/components/dashboard/StationsMapCard";
import PendingActionsPanel from "@/components/dashboard/PendingActionsPanel";
import { formatDate } from "@/lib/dateFormat";
import { base44 } from "@/api/base44Client";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import StationManagerDashboard from "@/components/dashboard/StationManagerDashboard";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { queryClientInstance } from "@/lib/query-client";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";
import SmartDailySummary from "@/components/dashboard/SmartDailySummary";
import CommandCenterHero from "@/components/dashboard/CommandCenterHero";
import RiskForecastPanel from "@/components/dashboard/RiskForecastPanel";
import DecisionQueue from "@/components/dashboard/DecisionQueue";
import { getRiskWeights } from "@/lib/riskWeights";
import { isActiveAttendance, isScheduledToday } from "@/lib/attendance";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import useProactiveAlerts from "@/hooks/useProactiveAlerts";
import OperationalAlerts from "@/components/dashboard/OperationalAlerts";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { data, currentUser, company, session, refresh } = useAuth();
  const [stoppageCount, setStoppageCount] = useState(0);
  const [showBranding, setShowBranding] = useState(false);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const { alerts: proactiveAlerts, loading: proactiveLoading } = useProactiveAlerts(data, currentUser, session);

  const loadStoppage = async () => {
    if (!currentUser) return;
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "listTargets",
        userRole: currentUser.role,
        userId: currentUser.id,
        stationId: currentUser.stationId || null,
        managedStations: currentUser.managedStations || [],
      });
      const list = res?.data?.targets || [];
      let count = 0;
      for (const tg of list) {
        for (const c of Array.isArray(tg.comments) ? tg.comments : []) {
          if (c.is_issue) count++;
        }
      }
      setStoppageCount(count);
    } catch {
      setStoppageCount(0);
    }
  };

  useEffect(() => {
    loadStoppage();
  }, [currentUser?.id]);

  // Today's attendance for the visible team — powers the attendance-rate stat card.
  useEffect(() => {
    if (!currentUser || !data) return;
    const ids = visibleEmployees(currentUser, data).map((e) => e.id);
    if (!ids.length) return;
    base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: ids })
      .then((res) => setAttendanceRows(res?.data?.rows || []))
      .catch(() => setAttendanceRows([]));
  }, [currentUser?.id, data?.employees?.length]);

  // Pull-to-refresh: full state reload — local fetches, tanstack-query caches,
  // and the AuthContext offline/online store sync.
  const handleRefresh = async () => {
    await Promise.allSettled([loadStoppage(), queryClientInstance.invalidateQueries()]);
    refresh();
  };

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const stationIds = new Set(stations.map((s) => s.id));

  const unreadNotifs = data.notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
  const pendingReportsCount = data.reports.filter((r) => stationIds.has(r.stationId) && r.status === "pending").length;
  const anonOpenCount = data.anonymousReports.filter((a) => stationIds.has(a.stationId) && a.status === "open").length;

  const welcomeAlerts = [
    { key: "notifications", icon: Bell, label: t("notifications"), value: unreadNotifs },
    { key: "stoppage", icon: AlertTriangle, label: t("stoppageIssues"), value: stoppageCount },
    ...(canApproveReports(currentUser) ? [{ key: "reports", icon: FileText, label: t("pendingReports"), value: pendingReportsCount }] : []),
    ...(canReplyAnon(currentUser) ? [{ key: "anon", icon: Megaphone, label: t("anonymous"), value: anonOpenCount }] : []),
  ];
  const welcomeHero = (
    <WelcomeHero name={currentUser.name} companyName={data.name} t={t} lang={lang} alerts={welcomeAlerts} employee={currentUser} companyId={company.id} />
  );

  const isEmployee = currentUser.role === "employee";
  const canEditBranding = isCompanyOwner(currentUser, data) || currentUser.role === "director";

  if (isEmployee) return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {welcomeHero}
        <OperationalAlerts alerts={proactiveAlerts} loading={proactiveLoading} lang={lang} />
        <EmployeeDashboard user={currentUser} company={company} data={data} />
      </div>
    </PullToRefresh>
  );

  // Station-scoped managers get their own station-focused dashboard.
  if (currentUser.role === "station_manager" || currentUser.role === "pgm") {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6">
          {welcomeHero}
          <OperationalAlerts alerts={proactiveAlerts} loading={proactiveLoading} lang={lang} />
          <StationManagerDashboard user={currentUser} data={data} stoppageCount={stoppageCount} />
        </div>
      </PullToRefresh>
    );
  }

  // Manager dashboard
  const tasks = data.tasks.filter((tk) => stationIds.has(tk.stationId));
  const reports = data.reports.filter((r) => stationIds.has(r.stationId));
  const anon = data.anonymousReports;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const completed = tasks.filter((tk) => tk.status === "completed").length;

  const teamEmployees = visibleEmployees(currentUser, data);
  const scheduledEmployees = teamEmployees.filter((employee) => isScheduledToday(employee, data) && !isOnLeaveToday(employee));
  const scheduledIds = new Set(scheduledEmployees.map((employee) => employee.id));
  const checkedInCount = attendanceRows.filter((row) => isActiveAttendance(row) && scheduledIds.has(row.employee_id)).length;
  const activeMembersCount = new Set(attendanceRows.filter((row) => ["present", "late"].includes(row.status) || isActiveAttendance(row)).map((row) => row.employee_id)).size;
  const attendanceRate = scheduledEmployees.length ? Math.round((checkedInCount / scheduledEmployees.length) * 100) : 0;
  const absentCount = Math.max(0, scheduledEmployees.length - checkedInCount);
  const now = Date.now();
  const delayedTasks = tasks.filter((task) => {
    const deadline = task.dueDate || task.endDate;
    return task.status !== "completed" && deadline && new Date(deadline).getTime() <= now + 3 * 86400000;
  }).length;
  // Safety (HSE) risk — critical stations, open hazards and incidents in the last 30 days.
  const safetyRecs = (data.safety || []).filter((s) => stationIds.has(s.stationId));
  const criticalStations = safetyRecs.filter((s) => s.level === "red").length;
  const openHazards = safetyRecs.reduce((sum, s) => sum + (s.hazards?.length || 0), 0);
  const recentIncidents = safetyRecs.reduce((sum, s) => sum + (s.incidentLog || []).filter((i) => i.at && now - new Date(i.at).getTime() <= 30 * 86400000).length, 0);
  // Incidents logged today only — drives the shield color on the hero card.
  const todayStr = new Date().toDateString();
  const todayIncidents = safetyRecs.reduce((sum, s) => sum + (s.incidentLog || []).filter((i) => i.at && new Date(i.at).toDateString() === todayStr).length, 0);
  const riskWeights = getRiskWeights(data);
  const riskScore = Math.min(100, Math.round(
    (absentCount * riskWeights.absent) + (delayedTasks * riskWeights.delayed) + (stoppageCount * riskWeights.stoppage) +
    (pendingReports * riskWeights.reports) + (criticalStations * riskWeights.critical) +
    (recentIncidents * riskWeights.incidents) + (openHazards * riskWeights.hazards)
  ));

  // Facts fed to the AI daily brief (generated once a day, cached locally).
  const briefFacts = [
    `attendance today: ${checkedInCount}/${teamEmployees.length} checked in (${attendanceRate}%)`,
    `tasks: ${completed}/${tasks.length} completed`,
    `pending daily reports awaiting review: ${pendingReports}`,
    `task stoppage issues: ${stoppageCount}`,
    `open anonymous complaints: ${anonOpenCount}`,
    `safety (HSE): ${criticalStations} critical stations, ${openHazards} open hazards, ${recentIncidents} incidents in last 30 days`,
  ];

  const pendingActionItems = [
    { key: "reports", icon: FileText, label: t("pendingReports"), count: pendingReports, to: "/app/daily-report" },
    { key: "stoppage", icon: AlertTriangle, label: t("stoppageIssues"), count: stoppageCount, to: "/app/performance" },
    ...(canReplyAnon(currentUser) ? [{ key: "anon", icon: Megaphone, label: t("anonymous"), count: anonOpenCount, to: "/app/complaints" }] : []),
  ];

  // Real six-month task activity — stable across renders and based on company data.
  const monthBuckets = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    monthBuckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatDate(date, lang, { month: "short" }),
    });
  }
  const chartData = monthBuckets.map(({ key, label }) => {
    const monthlyTasks = tasks.filter((task) => {
      const date = new Date(task.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}` === key;
    });
    return {
      month: label,
      completed: monthlyTasks.filter((task) => task.status === "completed").length,
      pending: monthlyTasks.filter((task) => task.status !== "completed").length,
    };
  });

  const recent = [
    ...tasks.map((tk) => ({ type: "task", text: `${tk.title} — ${t(tk.status)}`, at: tk.createdAt })),
    ...reports.map((r) => ({ type: "report", text: `${r.title} — ${t(r.status)}`, at: r.createdAt })),
    ...anon.map((a) => ({ type: "anon", text: `${t(a.type)} (${t(a.priority)}) — ${t(a.status)}`, at: a.createdAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-5 rounded-3xl bg-ops-bg p-3 text-ops-ink sm:p-5 lg:p-6">
      <CommandCenterHero companyName={data.name} riskScore={riskScore} activeStations={stations.length} breakdown={{ absentCount, delayedTasks, stoppageCount, pendingReports, criticalStations, openHazards, recentIncidents, weights: riskWeights }} safety={{ criticalStations, openHazards, recentIncidents, todayIncidents }} lang={lang} companyId={company.id} canEditWeights={canEditBranding} />
      <OnboardingChecklist data={data} lang={lang} t={t} />
      {canEditBranding && (
        <div className="flex justify-end">
          <button onClick={() => setShowBranding((value) => !value)} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-body hover:bg-muted">
            <Palette className="h-3.5 w-3.5 text-accent" />{t("logoSettings")}
          </button>
        </div>
      )}

      {showBranding && canEditBranding && (
        <BrandingSettingsCard
          companyId={company.id}
          branding={data.reportBranding}
          companyName={data.name || company?.name || ""}
          lang={lang}
          onClose={() => setShowBranding(false)}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-end font-heading text-xl font-semibold">{lang === "ar" ? "المؤشرات والتنبيهات" : "Indicators & Alerts"}</h2>
        <div className="grid gap-4 xl:grid-cols-[1fr,1.3fr]">
          <DashboardStatCards attendanceRate={attendanceRate} completed={completed} total={tasks.length} activeMembers={activeMembersCount} totalMembers={teamEmployees.length} t={t} />
          <OperationalAlerts alerts={proactiveAlerts} loading={proactiveLoading} lang={lang} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-end font-heading text-xl font-semibold">{lang === "ar" ? "المخاطر والقرارات" : "Risks & Decisions"}</h2>
        <div className="rounded-3xl bg-ops-dark p-4 text-white shadow-xl sm:p-6">
          <SmartDailySummary companyId={company.id} lang={lang} t={t} facts={briefFacts} />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RiskForecastPanel absentCount={absentCount} delayedTasks={delayedTasks} stoppageCount={stoppageCount} criticalStations={criticalStations} openHazards={openHazards} recentIncidents={recentIncidents} lang={lang} />
            <DecisionQueue pendingReports={pendingReports} delayedTasks={delayedTasks} safetySignals={criticalStations + recentIncidents} lang={lang} />
          </div>
        </div>
      </section>

      {/* Main analytics grid: big trend chart + map & pending actions column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart data={chartData} t={t} />
        </div>
        <div className="space-y-4">
          <StationsMapCard stations={stations} t={t} />
          <PendingActionsPanel items={pendingActionItems} t={t} />
        </div>
      </div>

      <TeamStatusPanel employees={teamEmployees} companyId={company.id} t={t} lang={lang} />

      {/* Recent activity */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-1">{formatDate(new Date(), lang, { month: "short" })}</p>
        <h3 className="hero-title text-2xl mb-4">{t("recentActivity")}</h3>
        <div className="divide-y divide-border">
          {recent.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.type === "anon" ? "bg-destructive" : r.type === "report" ? "bg-amber-500" : "bg-accent"}`} />
              <p className="text-sm font-body flex-1">{r.text}</p>
              <p className="text-xs text-muted-foreground font-body shrink-0">{formatDate(r.at, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}