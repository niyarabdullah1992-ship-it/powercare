import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canSeeAllStations, visibleEmployees, canApproveReports, canReplyAnon, isCompanyOwner } from "@/lib/permissions";
import TeamStatusPanel from "@/components/dashboard/TeamStatusPanel";
import WelcomeHero from "@/components/dashboard/WelcomeHero";
import { AlertTriangle, FileText, Bell, Megaphone, Palette } from "lucide-react";
import DashboardStatCards from "@/components/dashboard/DashboardStatCards";
import PendingActionsPanel from "@/components/dashboard/PendingActionsPanel";
import ExecutiveDashboard from "@/pages/ExecutiveDashboard";
import { formatDate } from "@/lib/dateFormat";
import { base44 } from "@/api/base44Client";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import StationManagerDashboard from "@/components/dashboard/StationManagerDashboard";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { queryClientInstance } from "@/lib/query-client";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";
import CommandCenterHero from "@/components/dashboard/CommandCenterHero";
import RiskForecastPanel from "@/components/dashboard/RiskForecastPanel";
import NiroPredictiveCenter from "@/components/dashboard/NiroPredictiveCenter";
import { getRiskWeights } from "@/lib/riskWeights";
import { isActiveAttendance, isScheduledToday } from "@/lib/attendance";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import useProactiveAlerts from "@/hooks/useProactiveAlerts";
import OperationalAlerts from "@/components/dashboard/OperationalAlerts";
import SigningStatusPanel from "@/components/dashboard/SigningStatusPanel";
import OperationsModuleGrid from "@/components/dashboard/OperationsModuleGrid";
import ProofCycleRibbon from "@/components/claude/ProofCycleRibbon";
import AttendanceTrendChart from "@/components/dashboard/AttendanceTrendChart";
import HandoffCommandBoard from "@/components/dashboard/HandoffCommandBoard";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { data, currentUser, company, session, refresh } = useAuth();
  const [stoppageCount, setStoppageCount] = useState(0);
  const [showBranding, setShowBranding] = useState(false);
  const [showOpsDetails, setShowOpsDetails] = useState(false);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [targetRows, setTargetRows] = useState([]);
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
      setTargetRows(list);
      let count = 0;
      for (const tg of list) {
        for (const c of Array.isArray(tg.comments) ? tg.comments : []) {
          if (c.is_issue) count++;
        }
      }
      setStoppageCount(count);
    } catch {
      setStoppageCount(0);
      setTargetRows([]);
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
      <div className="field-dashboard space-y-5">
        {welcomeHero}
        <ProofCycleRibbon lang={lang} />
        <OperationalAlerts alerts={proactiveAlerts} loading={proactiveLoading} lang={lang} />
        <SigningStatusPanel companyId={company.id} user={currentUser} lang={lang} />
        <EmployeeDashboard user={currentUser} company={company} data={data} />
      </div>
    </PullToRefresh>
  );

  // Station-scoped managers get their own station-focused dashboard.
  if (currentUser.role === "station_manager" || currentUser.role === "pgm") {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="ops-command-dashboard space-y-4">
          {welcomeHero}
          <ProofCycleRibbon lang={lang} />
          <OperationalAlerts alerts={proactiveAlerts} loading={proactiveLoading} lang={lang} />
          <SigningStatusPanel companyId={company.id} user={currentUser} lang={lang} />
          <StationManagerDashboard user={currentUser} data={data} stoppageCount={stoppageCount} />
        </div>
      </PullToRefresh>
    );
  }

  // Manager dashboard
  const sourceTasks = targetRows.length ? targetRows : data.tasks;
  const tasks = sourceTasks.filter((task) => stationIds.has(task.stationId || task.station_id || task.assignment_id));
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
    const deadline = task.dueDate || task.endDate || task.end_date;
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
      const date = new Date(task.createdAt || task.created_at || task.startDate || task.start_date);
      return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${date.getMonth()}` === key;
    });
    return {
      month: label,
      completed: monthlyTasks.reduce((sum, task) => sum + Number(task.completed_tasks ?? (task.status === "completed" ? 1 : 0)), 0),
      pending: monthlyTasks.reduce((sum, task) => sum + Math.max(0, Number(task.task_target ?? 1) - Number(task.completed_tasks ?? (task.status === "completed" ? 1 : 0))), 0),
    };
  });

  const recent = [
    ...tasks.map((tk) => ({ type: "task", text: `${tk.title} — ${t(tk.status)}`, at: tk.createdAt || tk.created_at })),
    ...reports.map((r) => ({ type: "report", text: `${r.title} — ${t(r.status)}`, at: r.createdAt })),
    ...anon.map((a) => ({ type: "anon", text: `${t(a.type)} (${t(a.priority)}) — ${t(a.status)}`, at: a.createdAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  const pendingLeaveCount = teamEmployees.reduce(
    (sum, employee) => sum + (employee.leaveRequests || []).filter((request) => request.status === "pending").length,
    0,
  );
  const leaveQueue = teamEmployees.flatMap((employee) =>
    (employee.leaveRequests || [])
      .filter((request) => request.status === "pending")
      .map((request) => ({
        id: `${employee.id}-${request.id || request.createdAt || request.startDate}`,
        name: employee.name,
        type: lang === "ar" ? (request.typeAr || request.type || "إجازة") : (request.type || "Leave"),
        date: formatDate(request.createdAt || request.startDate || new Date(), lang, { day: "numeric", month: "short" }),
        status: lang === "ar" ? "بانتظار" : "Pending",
      })),
  );
  const reportQueue = reports
    .filter((r) => r.status === "pending")
    .slice(0, 4)
    .map((r) => ({
      id: r.id,
      name: teamEmployees.find((e) => e.id === r.employeeId)?.name || r.authorName || (lang === "ar" ? "موظف" : "Staff"),
      type: lang === "ar" ? "تقرير يومي" : "Daily report",
      date: formatDate(r.createdAt || new Date(), lang, { day: "numeric", month: "short" }),
      status: lang === "ar" ? "بانتظار" : "Pending",
    }));
  const handoffQueue = [...leaveQueue, ...reportQueue].slice(0, 6);
  const handoffAlerts = [
    ...(delayedTasks ? [lang === "ar" ? `${delayedTasks} مهمة تقترب من موعدها أو متأخرة.` : `${delayedTasks} tasks due soon or overdue.`] : []),
    ...(absentCount ? [lang === "ar" ? `${absentCount} من المجدولين لم يسجّلوا حضورًا بعد.` : `${absentCount} scheduled staff not checked in yet.`] : []),
    ...(pendingReports ? [lang === "ar" ? `${pendingReports} تقرير يومي بانتظار الاعتماد.` : `${pendingReports} daily reports awaiting approval.`] : []),
    ...(lang === "ar"
      ? ["راجع طلبات الإجازة قبل إغلاق المسير.", "المهام المتأخرة تؤثر على سلسلة الإثبات."]
      : ["Review leave requests before payroll closes.", "Late tasks break the proof chain."]),
  ].filter(Boolean).slice(0, 3);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="ops-command-dashboard space-y-6">
      <HandoffCommandBoard
        lang={lang}
        employeesCount={teamEmployees.length}
        attendanceRate={attendanceRate}
        pendingLeave={pendingLeaveCount}
        completedTasks={completed}
        totalTasks={tasks.length}
        pendingReports={pendingReports}
        leaveQueue={handoffQueue}
        alerts={handoffAlerts}
        payrollCount={data.payroll?.length || 0}
      />

      <button
        type="button"
        onClick={() => setShowOpsDetails((v) => !v)}
        className="w-full rounded-[10px] border border-[#E4E7EC] bg-white px-4 py-3.5 text-start text-sm font-semibold text-[#101828] hover:bg-[#F9FAFB]"
      >
        <span className="flex items-center justify-between gap-3">
          <span>{lang === "ar" ? "دورة الإثبات وتفاصيل التشغيل" : "Proof cycle & operations detail"}</span>
          <span className="text-xs font-normal text-[#667085]">
            {showOpsDetails ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "عرض" : "Show")}
          </span>
        </span>
      </button>

      {showOpsDetails && (
        <div className="space-y-6">
          <ProofCycleRibbon lang={lang} />
          <div className="space-y-6 rounded-[10px] border border-[#E4E7EC] bg-white px-4 py-5">
          <CommandCenterHero companyName={data.name} riskScore={riskScore} activeStations={stations.length} breakdown={{ absentCount, delayedTasks, stoppageCount, pendingReports, criticalStations, openHazards, recentIncidents, weights: riskWeights }} safety={{ criticalStations, openHazards, recentIncidents, todayIncidents }} lang={lang} companyId={company.id} canEditWeights={canEditBranding} />

          <OperationsModuleGrid
            metrics={{
              stations: stations.length, tasks: tasks.length, completedTasks: completed, complaints: anonOpenCount,
              reports: reports.length, pendingReports, payroll: data.payroll?.length || 0,
              attendanceRate, checkedIn: checkedInCount, signing: data.signatureRequests?.length || data.signedDocuments?.length || 0,
              performance: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
              employees: teamEmployees.length, activeMembers: activeMembersCount,
              pendingLeave: pendingLeaveCount,
              offboarding: teamEmployees.filter((employee) => employee.profile?.offboarding?.status === "in_progress").length,
              safety: safetyRecs.length, hazards: openHazards,
              expenses: data.expenses?.length || 0, inventory: data.inventory?.length || data.inventoryItems?.length || 0,
              files: data.files?.length || 0, messages: data.messages?.length || 0,
            }}
            lang={lang} user={currentUser} data={data} company={company}
          />

          <div className="space-y-4">
            <OperationalAlerts alerts={proactiveAlerts} loading={proactiveLoading} lang={lang} />
            <SigningStatusPanel companyId={company.id} user={currentUser} lang={lang} />
            <PendingActionsPanel items={pendingActionItems} t={t} />
          </div>

          {["ops_manager", "director"].includes(currentUser.role) && <ExecutiveDashboard embedded />}
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

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <RiskForecastPanel absentCount={absentCount} delayedTasks={delayedTasks} stoppageCount={stoppageCount} criticalStations={criticalStations} openHazards={openHazards} recentIncidents={recentIncidents} lang={lang} />
            <NiroPredictiveCenter
              data={data}
              metrics={{ absentCount, delayedTasks, pendingReports, anonOpenCount, safetySignals: criticalStations + recentIncidents + openHazards }}
              alerts={proactiveAlerts}
              lang={lang}
            />
          </div>

          <DashboardStatCards
            attendanceRate={attendanceRate}
            activeMembers={activeMembersCount}
            totalMembers={teamEmployees.length}
            t={t}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AttendanceTrendChart data={chartData} t={t} />
            </div>
            <TeamStatusPanel employees={teamEmployees} companyId={company.id} t={t} lang={lang} />
          </div>

          <div className="rounded-[10px] border border-[#E4E7EC] bg-white p-4">
            <p className="mb-2 text-sm font-semibold">{t("recentActivity")}</p>
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
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}