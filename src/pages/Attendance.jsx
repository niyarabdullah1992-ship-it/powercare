import React, { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canCreateTasks, isCompanyOwner, visibleEmployees, visibleStations, hasHRPermission, hrScopeStations } from "@/lib/permissions";
import { Loader2 } from "lucide-react";
import CheckInOutCard from "@/components/attendance/CheckInOutCard";
import AttendanceExtraToolbar from "@/components/attendance/AttendanceExtraToolbar";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { queryClientInstance } from "@/lib/query-client";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import { ACCENT } from "@/lib/platformStyles";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

const ShiftsPlatformBoard = lazy(() => import("@/components/schedules/ShiftsPlatformBoard"));
const AttendanceMonthlyReport = lazy(() => import("@/components/attendance/AttendanceMonthlyReport"));
const AttendanceMonthCalendar = lazy(() => import("@/components/attendance/AttendanceMonthCalendar"));
const AttendanceMapDashboard = lazy(() => import("@/components/attendance/AttendanceMapDashboard"));
const AttendanceAnalytics = lazy(() => import("@/components/attendance/AttendanceAnalytics"));
const AttendanceLeaveRequests = lazy(() => import("@/components/attendance/AttendanceLeaveRequests"));
const AttendanceDailyDashboard = lazy(() => import("@/components/attendance/AttendanceDailyDashboard"));
const AttendanceSettingsBoard = lazy(() => import("@/components/attendance/AttendanceSettingsBoard"));

function TabLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <Loader2 style={{ width: 20, height: 20, color: ACCENT, animation: "spin 1s linear infinite" }} />
    </div>
  );
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
  const [tab, setTab] = useState(routeTab);

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
  const headerScope = useStationScope();
  const roster = data?.employees || [];
  const stationList = data?.stations || [];
  const employeesBase = canManageLeave && currentUser?.hrLevelId
    ? roster.filter((employee) => leaveScope === null || leaveScope.includes(employee.stationId || defaultStationId))
    : defaultEmployees;
  const employees = (employeesBase || []).filter((employee) =>
    matchesStationScope(employee.stationId || defaultStationId, headerScope),
  );

  const syncRoster = () => {
    if (!isManager || !company || employees.length === 0) return Promise.resolve();
    const director = roster.find((e) => e.role === "director")?.id || null;
    const managerFor = (e) => {
      const station = stationList.find((s) => s.id === (e.stationId || defaultStationId));
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
  const defaultHubTab = isManager ? "team" : "roster";
  const hubTabs = isManager
    ? [
        { key: "team", label: t("teamTab") },
        { key: "map", label: t("mapTab") },
        { key: "analytics", label: t("analyticsTab") },
        { key: "calendar", label: lang === "ar" ? "التقويم الشهري" : "Monthly calendar" },
        ...(canManageEmergency ? [{ key: "settings", label: t("settingsTab") }] : []),
      ]
    : [
        { key: "roster", label: lang === "ar" ? "اليوم" : "Day" },
        { key: "calendar", label: lang === "ar" ? "التقويم الشهري" : "Monthly calendar" },
      ];
  const allowedTabs = new Set([...hubTabs.map((item) => item.key), "report", "roster"]);
  const requested = routeTab || tab;
  let activeTab = defaultHubTab;
  if (focusShifts && isManager) activeTab = "schedule";
  else if (focusLeave && canManageLeave) activeTab = "leaves";
  else if (requested && allowedTabs.has(requested)) {
    if (isManager && requested === "roster") activeTab = "team";
    else if (!isManager && ["team", "map", "analytics", "settings"].includes(requested)) activeTab = "roster";
    else if (requested === "settings" && !canManageEmergency) activeTab = defaultHubTab;
    else activeTab = requested;
  }

  const selectTab = (key) => {
    setTab(key);
    if (location.pathname === "/app/attendance") {
      const next = new URLSearchParams(searchParams);
      if (key === defaultHubTab) next.delete("tab");
      else next.set("tab", key);
      setSearchParams(next, { replace: true });
    }
  };

  const calendarEmployees = employees.length ? employees : [currentUser];

  if (focusShifts) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <PlatformStampShell
          ar={lang === "ar"}
          title={lang === "ar" ? "الورديات" : "Shifts"}
          hint={lang === "ar" ? "جدول الفرع يغذي الحضور ثم المسير — لا نشر بلا اكتمال الوردية." : "The station roster feeds attendance, then payroll — no publish until the shift is complete."}
          maxWidth={1280}
        >
        <Suspense fallback={<TabLoader />}>
          <ShiftsPlatformBoard lang={lang} />
        </Suspense>
        </PlatformStampShell>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <PlatformStampShell
      ar={lang === "ar"}
      title={focusLeave
        ? (lang === "ar" ? "الإجازات" : "Leave")
        : (lang === "ar" ? "الحضور والانصراف" : "Attendance")}
      hint={focusLeave
        ? (lang === "ar"
          ? "إجازة معتمدة تغلق يوم الحضور؛ بلا أجر تُنشئ بند خصم في المسير قبل ملف مدى."
          : "Approved leave closes the attendance day; unpaid leave writes a deduction line before the Mudad file.")
        : (lang === "ar"
          ? "بصمة اليوم تغذي المهام والرواتب وإثبات العمل — أنت في سلسلة الحضور → الراتب."
          : "Today's check-in feeds tasks, payroll, and work proof — you are on the attendance → payroll chain.")}
      maxWidth={1280}
    >
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!focusLeave && (
        <AttendanceExtraToolbar
          lang={lang}
          tabs={hubTabs}
          activeTab={hubTabs.some((item) => item.key === activeTab) ? activeTab : defaultHubTab}
          onSelect={selectTab}
        />
      )}

      {!focusLeave && (
        <Suspense fallback={<TabLoader />}>
          {activeTab === "team" && isManager && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <CheckInOutCard currentUser={currentUser} company={company} t={t} compact />
              <AttendanceDailyDashboard employees={employees} currentUser={currentUser} company={company} data={data} t={t} />
            </div>
          )}
          {activeTab === "roster" && !isManager && (
            <CheckInOutCard currentUser={currentUser} company={company} t={t} />
          )}
          {activeTab === "report" && (
            <AttendanceMonthlyReport employees={employees.length ? employees : [currentUser]} defaultEmployeeId={currentUser.id} t={t} />
          )}
          {activeTab === "calendar" && (
            <AttendanceMonthCalendar employees={calendarEmployees} currentUser={currentUser} company={company} data={data} />
          )}
          {activeTab === "map" && isManager && <AttendanceMapDashboard employees={employees} t={t} />}
          {activeTab === "analytics" && isManager && (
            <AttendanceAnalytics employees={employees} company={company} data={data} t={t} />
          )}
          {activeTab === "settings" && canManageEmergency && (
            <AttendanceSettingsBoard company={company} currentUser={currentUser} t={t} canEditSettings={canEditSettings} />
          )}
        </Suspense>
      )}

      {focusLeave && canManageLeave && (
        <Suspense fallback={<TabLoader />}>
          <AttendanceLeaveRequests employees={employees} stations={stations} t={t} lang={lang} />
        </Suspense>
      )}
    </div>
    </PlatformStampShell>
    </PullToRefresh>
  );
}
