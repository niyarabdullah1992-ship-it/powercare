import React, { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canCreateTasks, isCompanyOwner, visibleEmployees, visibleStations, hasHRPermission, hrScopeStations } from "@/lib/permissions";
import { Loader2 } from "lucide-react";
import CheckInOutCard from "@/components/attendance/CheckInOutCard";
import AttendanceHandoffBoard from "@/components/attendance/AttendanceHandoffBoard";
import AttendanceDailyDashboard from "@/components/attendance/AttendanceDailyDashboard";
import CalendarExportCard from "@/components/calendar/CalendarExportCard";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import TimeFormatToggle from "@/components/attendance/TimeFormatToggle";
import { queryClientInstance } from "@/lib/query-client";

// Heavy tabs (maps/charts) load only when their tab is actually opened —
// the page itself now appears instantly with the check-in card + team list.
const AttendanceMonthlyReport = lazy(() => import("@/components/attendance/AttendanceMonthlyReport"));
const AttendanceSettingsPanel = lazy(() => import("@/components/attendance/AttendanceSettingsPanel"));
const AttendanceEmergencyPanel = lazy(() => import("@/components/attendance/AttendanceEmergencyPanel"));
const AttendanceLocationsPanel = lazy(() => import("@/components/attendance/AttendanceLocationsPanel"));
const AttendanceAnalytics = lazy(() => import("@/components/attendance/AttendanceAnalytics"));
const AttendanceMapDashboard = lazy(() => import("@/components/attendance/AttendanceMapDashboard"));
const ScheduleTab = lazy(() => import("@/components/attendance/ScheduleTab"));
const AttendanceLeaveRequests = lazy(() => import("@/components/attendance/AttendanceLeaveRequests"));
const MonthlyTaskCalendar = lazy(() => import("@/components/attendance/MonthlyTaskCalendar"));

function TabLoader() {
  return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>;
}

function tabFromRoute(pathname, searchTab) {
  if (pathname.endsWith("/shifts") || searchTab === "schedule") return "schedule";
  if (pathname.endsWith("/leave") || searchTab === "leaves") return "leaves";
  if (searchTab) return searchTab;
  return null;
}

export default function Attendance() {
  const { t, lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeTab = tabFromRoute(location.pathname, searchParams.get("tab"));
  const [tab, setTab] = useState(routeTab || "team");

  useEffect(() => {
    if (routeTab) setTab(routeTab);
  }, [routeTab]);

  const isManager = data && currentUser && canCreateTasks(currentUser);
  const canManageLeave = data && currentUser && (isManager || hasHRPermission(currentUser, data, "manage_leave"));
  // Company-wide attendance policy is restricted to the owner and senior operations roles.
  const canEditSettings = data && currentUser && (isCompanyOwner(currentUser, data) || ["director", "ops_manager"].includes(currentUser.role));
  const canManageEmergency = data && currentUser && (canEditSettings || currentUser.role === "station_manager");
  const defaultEmployees = data && currentUser ? visibleEmployees(currentUser, data) : [];
  const stations = data && currentUser ? visibleStations(currentUser, data) : [];
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

  const focusShifts = location.pathname.endsWith("/shifts") || tab === "schedule";
  const focusLeave = location.pathname.endsWith("/leave") || tab === "leaves";
  const pageTitle = focusShifts
    ? (lang === "ar" ? "الورديات" : "Shifts")
    : focusLeave
      ? (lang === "ar" ? "طلبات الإجازة" : "Leave Requests")
      : t("attendanceScheduling");
  const pageDescription = focusShifts
    ? (lang === "ar" ? "جدول شهري لكل محطة · الفحص النظامي قبل النشر" : "Monthly schedule per station · statutory checks before publishing")
    : focusLeave
      ? (lang === "ar" ? "الرصيد يُخصم عند الاعتماد فقط" : "Balance is deducted only on approval")
      : (lang === "ar" ? "مباشر · التحقق بالموقع الجغرافي" : "Live · geofence verified");

  const tabs = [
    { key: "calendar", label: lang === "ar" ? "التقويم الشهري" : "Monthly calendar" },
    ...(isManager ? [
      { key: "team", label: t("teamTab") },
      { key: "map", label: t("mapTab") },
      { key: "schedule", label: t("scheduleTab") },
      { key: "report", label: t("reportTab") },
      { key: "analytics", label: t("analyticsTab") },
    ] : []),
    ...(canManageLeave ? [{ key: "leaves", label: t("leaveRequests") }] : []),
    ...(canManageEmergency ? [{ key: "settings", label: t("settingsTab") }] : []),
  ];
  const activeTab = focusShifts && isManager
    ? "schedule"
    : focusLeave && canManageLeave
      ? "leaves"
      : (tabs.some((item) => item.key === tab) ? tab : tabs[0]?.key);

  const selectTab = (key) => {
    setTab(key);
    if (location.pathname === "/app/attendance") {
      const next = new URLSearchParams(searchParams);
      if (key === "team") next.delete("tab");
      else next.set("tab", key);
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="attendance-hub mx-auto max-w-[1320px] space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 font-heading text-[22px] font-semibold text-[#14284B]">{pageTitle}</h1>
          <p className="m-0 mt-1 text-[13px] text-[#5A6B85]">{pageDescription}</p>
        </div>
        <TimeFormatToggle lang={lang} />
      </header>

      {!focusShifts && !focusLeave && (
        <>
          <CheckInOutCard currentUser={currentUser} company={company} t={t} />
          <CalendarExportCard data={data} user={currentUser} />
        </>
      )}

      {!isManager && !canManageLeave && !focusShifts && !focusLeave && (
        <Suspense fallback={<TabLoader />}>
          <AttendanceMonthlyReport employees={[currentUser]} defaultEmployeeId={currentUser.id} t={t} />
        </Suspense>
      )}

      <div className="space-y-4">
          {!focusShifts && !focusLeave && (
          <div className="flex w-max max-w-full gap-0.5 overflow-x-auto rounded-[10px] bg-[#EEF2F6] p-0.5 no-scrollbar">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => selectTab(tb.key)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition ${
                  activeTab === tb.key
                    ? "bg-white text-[#14284B] shadow-sm"
                    : "text-[#5A6B85] hover:text-[#14284B]"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-5">
              <AttendanceHandoffBoard />
              <AttendanceDailyDashboard employees={employees} currentUser={currentUser} company={company} data={data} t={t} />
            </div>
          )}
          <Suspense fallback={<TabLoader />}>
            {activeTab === "calendar" && <MonthlyTaskCalendar />}
            {activeTab === "map" && <AttendanceMapDashboard employees={employees} t={t} />}
            {activeTab === "schedule" && <ScheduleTab />}
            {activeTab === "report" && <AttendanceMonthlyReport employees={employees} defaultEmployeeId={currentUser.id} t={t} />}
            {activeTab === "analytics" && <AttendanceAnalytics employees={employees} t={t} />}
            {activeTab === "leaves" && <AttendanceLeaveRequests employees={employees} stations={stations} t={t} lang={lang} />}
            {activeTab === "settings" && canManageEmergency && (
              <div className="space-y-4">
                <AttendanceEmergencyPanel company={company} currentUser={currentUser} />
                {canEditSettings && <AttendanceLocationsPanel company={company} currentUser={currentUser} t={t} />}
                {canEditSettings && <AttendanceSettingsPanel company={company} currentUser={currentUser} t={t} />}
              </div>
            )}
          </Suspense>
        </div>
    </div>
    </PullToRefresh>
  );
}