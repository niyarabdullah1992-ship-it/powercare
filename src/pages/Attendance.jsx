import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canCreateTasks, isCompanyOwner, visibleEmployees, visibleStations, hasHRPermission, hrScopeStations } from "@/lib/permissions";
import { ClipboardCheck, Loader2, ArrowLeftRight } from "lucide-react";
import CheckInOutCard from "@/components/attendance/CheckInOutCard";
import AttendanceDailyDashboard from "@/components/attendance/AttendanceDailyDashboard";
import CalendarExportCard from "@/components/calendar/CalendarExportCard";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import TimeFormatToggle from "@/components/attendance/TimeFormatToggle";
import { queryClientInstance } from "@/lib/query-client";
import PageHeader from "@/components/PageHeader";

// Heavy tabs (maps/charts) load only when their tab is actually opened —
// the page itself now appears instantly with the check-in card + team list.
const AttendanceMonthlyReport = lazy(() => import("@/components/attendance/AttendanceMonthlyReport"));
const AttendanceSettingsPanel = lazy(() => import("@/components/attendance/AttendanceSettingsPanel"));
const AttendanceEmergencyPanel = lazy(() => import("@/components/attendance/AttendanceEmergencyPanel"));
const AttendanceLocationsPanel = lazy(() => import("@/components/attendance/AttendanceLocationsPanel"));
const AttendanceAnalytics = lazy(() => import("@/components/attendance/AttendanceAnalytics"));
const AttendanceMapDashboard = lazy(() => import("@/components/attendance/AttendanceMapDashboard"));
const ScheduleTab = lazy(() => import("@/components/attendance/ScheduleTab"));
const MonthlyTaskCalendar = lazy(() => import("@/components/attendance/MonthlyTaskCalendar"));

function TabLoader() {
  return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>;
}

export default function Attendance() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company, refresh } = useAuth();
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") || "today");

  const isManager = data && currentUser && canCreateTasks(currentUser);
  const canManageLeave = data && currentUser && (isManager || hasHRPermission(currentUser, data, "manage_leave"));
  // Company-wide attendance policy is restricted to the owner and senior operations roles.
  const canEditSettings = data && currentUser && (isCompanyOwner(currentUser, data) || ["director", "ops_manager"].includes(currentUser.role));
  const canManageEmergency = data && currentUser && (canEditSettings || currentUser.role === "station_manager");
  const defaultEmployees = data && currentUser ? visibleEmployees(currentUser, data) : [];
  const leaveScope = data && currentUser?.hrLevelId ? hrScopeStations(currentUser, data) : null;
  const defaultStationId = data?.stations?.[0]?.id || null;
  const employees = canManageLeave && currentUser?.hrLevelId
    ? (data.employees || []).filter((employee) => leaveScope === null || leaveScope.includes(employee.stationId || defaultStationId))
    : defaultEmployees;

  const syncRoster = () => {
    if (!isManager || !company || employees.length === 0) return Promise.resolve();
    const director = data.employees.find((e) => e.role === "director")?.id || null;
    const managerFor = (e) => {
      const station = data.stations.find((s) => s.id === (e.stationId || defaultStationId));
      return station?.managerId || director;
    };
    return base44.functions.invoke("supabaseAttendance", {
      action: "syncRoster",
      companyId: company.id,
      employees: employees.map((e) => ({ id: e.id, name: e.name, stationId: e.stationId || defaultStationId, managerId: managerFor(e) })),
    }).catch(() => {});
  };

  useEffect(() => {
    syncRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, company?.id, employees.length]);

  // Pull-to-refresh: full state reload — roster sync, tanstack-query caches,
  // and the AuthContext offline/online store sync.
  const handleRefresh = async () => {
    await Promise.allSettled([syncRoster(), queryClientInstance.invalidateQueries()]);
    refresh();
  };

  if (!data || !currentUser) return null;

  // Three audiences, four tabs: today's answer, the plan, the record, the setup.
  const tabs = [
    { key: "today", label: ar ? "اليوم" : "Today" },
    ...(isManager ? [{ key: "schedules", label: ar ? "الجداول والورديات" : "Schedules & shifts" }] : []),
    { key: "reports", label: ar ? "التقارير" : "Reports" },
    ...(canManageEmergency ? [{ key: "settings", label: t("settingsTab") }] : []),
  ];
  const activeTab = tabs.some((item) => item.key === tab) ? tab : tabs[0]?.key;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="attendance-hub space-y-6">
      <PageHeader title={t("attendanceScheduling")} icon={ClipboardCheck} actions={<TimeFormatToggle lang={lang} />} />

      <div className="space-y-4">
          <div className="flex gap-2 border-b border-border overflow-x-auto no-scrollbar">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-3 py-2 text-sm font-body border-b-2 -mb-px transition whitespace-nowrap shrink-0 ${activeTab === tb.key ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {activeTab === "today" && (
            <div className="space-y-4">
              <CheckInOutCard currentUser={currentUser} company={company} t={t} />
              {canManageLeave && (
                <Link to="/app/leave-requests" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
                  <ArrowLeftRight className="h-3.5 w-3.5" />{ar ? "طلبات الإجازة في قسم الإجازات والطلبات" : "Leave requests live in Leaves & requests"}
                </Link>
              )}
              {isManager && <AttendanceDailyDashboard employees={employees} currentUser={currentUser} company={company} data={data} t={t} onOpenSchedules={() => setTab("schedules")} />}
              {isManager && (
                <Suspense fallback={<TabLoader />}>
                  <AttendanceMapDashboard employees={employees} t={t} />
                </Suspense>
              )}
            </div>
          )}

          <Suspense fallback={<TabLoader />}>
            {activeTab === "schedules" && isManager && (
              <div className="space-y-4">
                <ScheduleTab />
                <MonthlyTaskCalendar />
              </div>
            )}
            {activeTab === "reports" && (
              <div className="space-y-4">
                <AttendanceMonthlyReport employees={isManager ? employees : [currentUser]} defaultEmployeeId={currentUser.id} t={t} />
                {isManager && <AttendanceAnalytics employees={employees} t={t} />}
              </div>
            )}
            {activeTab === "settings" && canManageEmergency && (
              <div className="space-y-4">
                <AttendanceEmergencyPanel company={company} currentUser={currentUser} />
                {canEditSettings && <AttendanceLocationsPanel company={company} currentUser={currentUser} t={t} />}
                {canEditSettings && <AttendanceSettingsPanel company={company} currentUser={currentUser} t={t} />}
                <CalendarExportCard data={data} user={currentUser} />
              </div>
            )}
          </Suspense>
        </div>
    </div>
    </PullToRefresh>
  );
}