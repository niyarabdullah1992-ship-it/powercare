import React, { useState, useEffect, lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canCreateTasks, isCompanyOwner, visibleEmployees, hasHRPermission, hrScopeStations } from "@/lib/permissions";
import { ClipboardCheck, Loader2 } from "lucide-react";
import CheckInOutCard from "@/components/attendance/CheckInOutCard";
import AttendanceDailyDashboard from "@/components/attendance/AttendanceDailyDashboard";
import CalendarExportCard from "@/components/calendar/CalendarExportCard";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import TimeFormatToggle from "@/components/attendance/TimeFormatToggle";
import { queryClientInstance } from "@/lib/query-client";
import PageHeader from "@/components/PageHeader";
import { HQ_STATION_ID } from "@/lib/store";

// Heavy tabs (maps/charts) load only when their tab is actually opened —
// the page itself now appears instantly with the check-in card + team list.
const AttendanceMonthlyReport = lazy(() => import("@/components/attendance/AttendanceMonthlyReport"));
const AttendanceSettingsPanel = lazy(() => import("@/components/attendance/AttendanceSettingsPanel"));
const AttendanceLocationsPanel = lazy(() => import("@/components/attendance/AttendanceLocationsPanel"));
const AttendanceAnalytics = lazy(() => import("@/components/attendance/AttendanceAnalytics"));
const AttendanceMapDashboard = lazy(() => import("@/components/attendance/AttendanceMapDashboard"));
const ScheduleTab = lazy(() => import("@/components/attendance/ScheduleTab"));
const AttendanceLeaveRequests = lazy(() => import("@/components/attendance/AttendanceLeaveRequests"));

function TabLoader() {
  return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>;
}

export default function Attendance() {
  const { t, lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  const [tab, setTab] = useState("team");

  const isManager = data && currentUser && canCreateTasks(currentUser);
  const canManageLeave = data && currentUser && (isManager || hasHRPermission(currentUser, data, "manage_leave"));
  // Company-wide attendance policy is restricted to the owner and senior operations roles.
  const canEditSettings = data && currentUser && (isCompanyOwner(currentUser, data) || ["director", "ops_manager"].includes(currentUser.role));
  const defaultEmployees = data && currentUser ? visibleEmployees(currentUser, data) : [];
  const leaveScope = data && currentUser?.hrLevelId ? hrScopeStations(currentUser, data) : null;
  const employees = canManageLeave && currentUser?.hrLevelId
    ? (data.employees || []).filter((employee) => leaveScope === null || leaveScope.includes(employee.stationId || HQ_STATION_ID))
    : defaultEmployees;

  const syncRoster = () => {
    if (!isManager || !company || employees.length === 0) return Promise.resolve();
    const director = data.employees.find((e) => e.role === "director")?.id || null;
    const managerFor = (e) => {
      const station = data.stations.find((s) => s.id === (e.stationId || HQ_STATION_ID));
      return station?.managerId || director;
    };
    return base44.functions.invoke("supabaseAttendance", {
      action: "syncRoster",
      companyId: company.id,
      employees: employees.map((e) => ({ id: e.id, name: e.name, stationId: e.stationId || HQ_STATION_ID, managerId: managerFor(e) })),
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

  const tabs = [
    ...(isManager ? [
      { key: "team", label: t("teamTab") },
      { key: "map", label: t("mapTab") },
      { key: "schedule", label: t("scheduleTab") },
      { key: "report", label: t("reportTab") },
      { key: "analytics", label: t("analyticsTab") },
    ] : []),
    ...(canManageLeave ? [{ key: "leaves", label: t("leaveRequests") }] : []),
    ...(canEditSettings ? [{ key: "settings", label: t("settingsTab") }] : []),
  ];
  const activeTab = tabs.some((item) => item.key === tab) ? tab : tabs[0]?.key;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <PageHeader title={t("attendanceScheduling")} icon={ClipboardCheck} actions={<TimeFormatToggle lang={lang} />} />

      <CheckInOutCard currentUser={currentUser} company={company} t={t} />

      <CalendarExportCard data={data} user={currentUser} />

      {!isManager && !canManageLeave && (
        <Suspense fallback={<TabLoader />}>
          <AttendanceMonthlyReport employees={[currentUser]} defaultEmployeeId={currentUser.id} t={t} />
        </Suspense>
      )}

      {(isManager || canManageLeave) && (
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

          {activeTab === "team" && <AttendanceDailyDashboard employees={employees} currentUser={currentUser} t={t} />}
          <Suspense fallback={<TabLoader />}>
            {activeTab === "map" && <AttendanceMapDashboard employees={employees} t={t} />}
            {activeTab === "schedule" && <ScheduleTab />}
            {activeTab === "report" && <AttendanceMonthlyReport employees={employees} defaultEmployeeId={currentUser.id} t={t} />}
            {activeTab === "analytics" && <AttendanceAnalytics employees={employees} t={t} />}
            {activeTab === "leaves" && <AttendanceLeaveRequests employees={employees} stations={data.stations || []} t={t} lang={lang} />}
            {activeTab === "settings" && canEditSettings && (
              <div className="space-y-4">
                <AttendanceLocationsPanel company={company} currentUser={currentUser} t={t} />
                <AttendanceSettingsPanel company={company} currentUser={currentUser} t={t} />
              </div>
            )}
          </Suspense>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}