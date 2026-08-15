import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, visibleEmployees } from "@/lib/permissions";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import { deriveTeamAttendanceToday } from "@/lib/attendance";
import { listLocalTodayAttendance, mergeAttendanceRows } from "@/lib/localAttendanceFallback";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import DashboardPersonaBar from "@/components/dashboard/DashboardPersonaBar";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import CommandGlanceBoard, { buildCommandGlance } from "@/components/dashboard/CommandGlanceBoard";
import OperationsModuleGrid from "@/components/dashboard/OperationsModuleGrid";
import StationManagerDashboard from "@/components/dashboard/StationManagerDashboard";

function pendingSigningCount(data) {
  return (data?.signatureRequests || []).filter((row) => {
    const status = String(row.status || "").toLowerCase();
    return status === "pending" || status === "awaiting" || status === "in_progress";
  }).length;
}

function pendingExpenseCount(data) {
  return (data?.expenses || data?.expenseClaims || []).filter((row) =>
    ["submitted", "manager_approved", "pending"].includes(row.status),
  ).length;
}

function openHazardCount(data) {
  return (data?.safety || []).reduce(
    (sum, rec) => sum + (rec.hazards || []).filter((hazard) => !hazard.closedAt).length,
    0,
  );
}

function buildModuleMetrics(data, extra = {}) {
  const tasks = data?.tasks || [];
  const reports = data?.reports || [];
  const completed = extra.completedTasks ?? tasks.filter((task) => task.status === "completed").length;
  const taskTotal = extra.tasks ?? tasks.length;
  return {
    stations: data?.stations?.length || 0,
    tasks: taskTotal,
    completedTasks: completed,
    openTasks: extra.openTasks ?? Math.max(0, taskTotal - completed),
    complaints: extra.complaints ?? (data?.anonymousReports || []).filter((row) => row.status === "open").length,
    reports: extra.reports ?? reports.length,
    pendingReports: extra.pendingReports ?? reports.filter((row) => row.status === "pending").length,
    payroll: data?.payroll?.length || 0,
    attendanceRate: extra.attendanceRate ?? 0,
    checkedIn: extra.checkedIn ?? 0,
    absentCount: extra.absentCount ?? 0,
    scheduled: extra.scheduled ?? 0,
    signing: extra.signing ?? pendingSigningCount(data),
    performance: extra.performance ?? (taskTotal ? Math.round((completed / taskTotal) * 100) : 0),
    employees: extra.employees ?? (data?.employees?.length || 0),
    activeMembers: extra.activeMembers ?? 0,
    pendingLeave: extra.pendingLeave ?? 0,
    offboarding: extra.offboarding ?? 0,
    safety: (data?.safety || []).length,
    hazards: extra.hazards ?? openHazardCount(data),
    expenses: extra.pendingExpenses ?? pendingExpenseCount(data),
    inventory: data?.inventory?.length || data?.inventoryItems?.length || 0,
    files: data?.files?.length || 0,
    messages: data?.messages?.length || 0,
  };
}

export default function Dashboard() {
  const { lang } = useI18n();
  const headerScope = useStationScope();
  const { data, currentUser, company, refresh } = useAuth();
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [targetRows, setTargetRows] = useState([]);

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
    } catch {
      setTargetRows([]);
    }
  };

  useEffect(() => {
    loadStoppage();
  }, [currentUser?.id]);

  const loadAttendance = () => {
    if (!currentUser || !data) return;
    const ids = visibleEmployees(currentUser, data).map((e) => e.id);
    const apply = (cloudRows) => {
      setAttendanceRows(mergeAttendanceRows(cloudRows || [], listLocalTodayAttendance(company?.id, data)));
    };
    if (!ids.length) {
      apply([]);
      return;
    }
    base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: ids })
      .then((res) => apply(res?.data?.rows || []))
      .catch(() => apply([]));
  };

  useEffect(() => {
    loadAttendance();
    const onUpdated = () => loadAttendance();
    window.addEventListener("attendance-updated", onUpdated);
    return () => window.removeEventListener("attendance-updated", onUpdated);
  }, [currentUser?.id, data?.employees?.length, data?.personalAttendance?.length, company?.id]);

  const handleRefresh = async () => {
    await Promise.allSettled([loadStoppage(), queryClientInstance.invalidateQueries()]);
    loadAttendance();
    refresh();
  };

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data).filter((s) => matchesStationScope(s.id, headerScope));
  const stationIds = new Set(stations.map((s) => s.id));
  const isEmployee = currentUser.role === "employee";
  const teamEmployees = visibleEmployees(currentUser, data).filter((employee) =>
    matchesStationScope(employee.stationId, headerScope),
  );
  const mergedAttendanceRows = mergeAttendanceRows(
    attendanceRows,
    listLocalTodayAttendance(company?.id, data),
  );
  const todayAtt = deriveTeamAttendanceToday(teamEmployees, mergedAttendanceRows, data);
  const attendanceRate = todayAtt.rate;
  const checkedInCount = todayAtt.presentLike;
  const absentCount = todayAtt.absent;
  const attendanceExtras = {
    attendanceRate,
    checkedIn: checkedInCount,
    absentCount,
    scheduled: todayAtt.scheduled,
    activeMembers: todayAtt.presentLike,
    employees: teamEmployees.length,
  };

  if (isEmployee) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <PlatformStampShell
          ar={lang === "ar"}
          title={lang === "ar" ? "لوحة العمل" : "Work dashboard"}
          hint={lang === "ar" ? "حضور اليوم، المهام، ودورة الإثبات في مكان واحد." : "Today's attendance, tasks, and the proof cycle in one place."}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <DashboardPersonaBar lang={lang} />
            <EmployeeDashboard user={currentUser} company={company} data={data} />
            <OperationsModuleGrid
              metrics={buildModuleMetrics(data, attendanceExtras)}
              lang={lang}
              user={currentUser}
              data={data}
              company={company}
            />
          </div>
        </PlatformStampShell>
      </PullToRefresh>
    );
  }

  if (currentUser.role === "station_manager" || currentUser.role === "pgm") {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <StationManagerDashboard user={currentUser} data={data} />
        </div>
      </PullToRefresh>
    );
  }

  const sourceTasks = targetRows.length ? targetRows : data.tasks;
  const tasks = sourceTasks.filter((task) => stationIds.has(task.stationId || task.station_id || task.assignment_id));
  const reports = (data.reports || []).filter((r) => stationIds.has(r.stationId));

  const glance = buildCommandGlance({
    lang,
    tasks,
    employees: teamEmployees,
    attendanceRows: mergedAttendanceRows,
    reports: [
      ...reports,
      ...(data.anonymousReports || []).filter((row) => stationIds.has(row.stationId)),
    ],
    proofs: (data.workProofs || []).filter((proof) => stationIds.has(proof.stationId)),
    present: checkedInCount,
    scheduled: todayAtt.scheduled,
  });

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <CommandGlanceBoard lang={lang} {...glance} />
      </div>
    </PullToRefresh>
  );
}
