import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { visibleStations } from "@/lib/permissions";
import { useAuth } from "@/lib/PowerCareAuth";
import { deriveTeamAttendanceToday } from "@/lib/attendance";
import { listLocalTodayAttendance, mergeAttendanceRows } from "@/lib/localAttendanceFallback";
import { leaveTypeLabel } from "@/lib/leaveTypes";
import { stationIdForTreeEmployee } from "@/lib/orgTree";
import { formatDate } from "@/lib/dateFormat";
import QuickCheckInCard from "@/components/attendance/QuickCheckInCard";
import HandoffCommandBoard from "@/components/dashboard/HandoffCommandBoard";

/**
 * Station-manager Command Center — same board language as exec, station-scoped.
 */
export default function StationManagerDashboard({ user, data, stoppageCount = 0 }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company } = useAuth();
  const [attendanceRows, setAttendanceRows] = useState([]);
  const stations = visibleStations(user, data);
  const stationIds = new Set(stations.map((s) => s.id));

  const defaultStationId = data.stations?.[0]?.id || null;
  const team = (data.employees || []).filter((employee) =>
    stationIds.has(stationIdForTreeEmployee(data, employee.id) || employee.stationId || defaultStationId),
  );
  const tasks = (data.tasks || []).filter((tk) => stationIds.has(tk.stationId));
  const dayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const reports = (data.reports || []).filter((r) =>
    stationIds.has(r.stationId)
    && (r.kind === "daily" || r.type === "daily" || !r.kind)
    && (!r.dateKey || r.dateKey === dayKey),
  );
  const pendingReports = reports.filter((r) => !r.approved);
  const unfiledDaily = stations.filter((st) => {
    const r = reports.find((x) => String(x.stationId) === String(st.id));
    return !r?.filedAt;
  }).length;
  const completed = tasks.filter((tk) => tk.status === "completed").length;

  useEffect(() => {
    const apply = (cloudRows) => {
      setAttendanceRows(mergeAttendanceRows(cloudRows || [], listLocalTodayAttendance(company?.id, data)));
    };
    if (!team.length) {
      apply([]);
      return undefined;
    }
    const load = () => {
      base44.functions
        .invoke("supabaseAttendance", { action: "listDaily", employeeIds: team.map((e) => e.id) })
        .then((res) => apply(res?.data?.rows || []))
        .catch(() => apply([]));
    };
    load();
    window.addEventListener("attendance-updated", load);
    return () => window.removeEventListener("attendance-updated", load);
  }, [team.map((e) => e.id).join(","), company?.id, data?.personalAttendance?.length]);

  const mergedAttendanceRows = mergeAttendanceRows(
    attendanceRows,
    listLocalTodayAttendance(company?.id, data),
  );
  const todayAtt = deriveTeamAttendanceToday(team, mergedAttendanceRows, data);
  const attendanceRate = todayAtt.rate;
  const absentCount = todayAtt.absent;
  const presentIds = new Set(
    mergedAttendanceRows
      .filter((row) => row.check_in_at || row.checkInAt)
      .map((row) => String(row.employee_id ?? row.employeeId)),
  );

  const safetyRecs = (data.safety || []).filter((s) => stationIds.has(s.stationId));
  const openHazards = safetyRecs.reduce((sum, s) => sum + (s.hazards?.length || 0), 0);
  const criticalStations = safetyRecs.filter((s) => s.level === "red").length;
  const now = Date.now();
  const delayedTasks = tasks.filter((task) => {
    const deadline = task.dueDate || task.endDate || task.end_date;
    return task.status !== "completed" && deadline && new Date(deadline).getTime() <= now + 3 * 86400000;
  }).length;

  const pendingLeaveCount = team.reduce(
    (sum, employee) => sum + (employee.leaveRequests || []).filter((request) => request.status === "pending").length,
    0,
  );
  const leaveQueue = team.flatMap((employee) =>
    (employee.leaveRequests || [])
      .filter((request) => request.status === "pending")
      .map((request) => ({
        id: `${employee.id}-${request.id || request.createdAt || request.startDate}`,
        name: employee.name,
        type: leaveTypeLabel(request.typeAr || request.type, ar),
        date: formatDate(request.createdAt || request.startDate || new Date(), lang, { day: "numeric", month: "short" }),
        status: ar
          ? (request.awaiting === "finance" ? "بانتظار المالية" : request.awaiting === "hr" ? "بانتظار HR" : "بانتظار المدير")
          : (request.awaiting === "finance" ? "Awaiting finance" : request.awaiting === "hr" ? "Awaiting HR" : "Awaiting manager"),
      })),
  );
  const reportQueue = pendingReports.slice(0, 4).map((r) => ({
    id: r.id,
    name: team.find((e) => e.id === r.employeeId)?.name || r.authorName || (ar ? "موظف" : "Staff"),
    type: ar ? "تقرير يومي" : "Daily report",
    date: formatDate(r.createdAt || new Date(), lang, { day: "numeric", month: "short" }),
    status: ar ? "بانتظار المدير" : "Awaiting manager",
  }));
  const handoffQueue = [...leaveQueue, ...reportQueue].slice(0, 6);

  const riskScore = Math.min(
    100,
    Math.round(absentCount * 8 + delayedTasks * 6 + stoppageCount * 5 + pendingReports.length * 4 + criticalStations * 12 + openHazards * 5),
  );
  const readinessScore = Math.max(0, Math.min(100, 100 - riskScore));
  const readinessFactors = [
    { label: ar ? "حضور اليوم" : "Today's attendance", pct: attendanceRate },
    { label: ar ? "مهام" : "Tasks", pct: tasks.length ? Math.round((completed / tasks.length) * 100) : 100 },
    { label: ar ? "سلامة" : "Safety", pct: Math.max(0, 100 - openHazards * 12 - criticalStations * 20) },
    { label: ar ? "اعتمادات" : "Approvals", pct: Math.max(0, 100 - (pendingLeaveCount + pendingReports.length) * 8) },
  ];

  const handoffAlerts = [
    ...(delayedTasks ? [{ text: ar ? `${delayedTasks} مهمة تقترب من موعدها أو متأخرة.` : `${delayedTasks} tasks due soon or overdue.`, to: "/app/tasks" }] : []),
    ...(absentCount ? [{ text: ar ? `${absentCount} من المجدولين لم يسجّلوا حضورًا بعد.` : `${absentCount} scheduled staff not checked in yet.`, to: "/app/attendance" }] : []),
    ...(unfiledDaily ? [{ text: ar ? `${unfiledDaily} فرع بلا رفع يومي — الوردية لا تُغلق.` : `${unfiledDaily} station(s) without a daily filing — shift cannot close.`, to: "/app/daily-report" }] : []),
    ...(pendingReports.length && !unfiledDaily ? [{ text: ar ? `${pendingReports.length} تقرير يومي بانتظار اعتماد العمليات.` : `${pendingReports.length} daily report(s) awaiting ops approval.`, to: "/app/daily-report" }] : []),
    ...(openHazards ? [{ text: ar ? `${openHazards} مخاطر سلامة بانتظار الإغلاق.` : `${openHazards} open safety hazards awaiting closure.`, to: "/app/safety" }] : []),
    ...(stoppageCount ? [{ text: ar ? `${stoppageCount} عوائق تشغيل معلّمة على المهام.` : `${stoppageCount} stoppage issues flagged on tasks.`, to: "/app/tasks" }] : []),
  ].slice(0, 4);

  const monthHired = team.filter((e) => {
    const d = new Date(e.createdAt || e.hiredAt || e.startDate || 0);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <HandoffCommandBoard
        lang={lang}
        readinessScore={readinessScore}
        factors={readinessFactors}
        employeesCount={todayAtt.scheduled}
        employeesDelta={monthHired || null}
        attendanceRate={attendanceRate}
        pendingLeave={pendingLeaveCount}
        pendingReports={pendingReports.length}
        leaveQueue={handoffQueue}
        alerts={handoffAlerts}
        stations={stations.map((s) => {
          const crew = team.filter((e) => (stationIdForTreeEmployee(data, e.id) || e.stationId) === s.id && presentIds.has(String(e.id))).length;
          const open = tasks.filter((tk) => tk.stationId === s.id && tk.status !== "completed").length
            + (safetyRecs.find((r) => r.stationId === s.id)?.hazards?.length || 0);
          return { id: s.id, name: s.name, code: s.code || s.shortCode || "", crew, open, to: "/app/attendance" };
        })}
        stationsCount={stations.length}
        openHazards={openHazards}
        payrollCount={team.length}
        avgApprovalHours={pendingLeaveCount + pendingReports.length > 0 ? 4 : null}
      />
      <QuickCheckInCard currentUser={user} company={company} />
    </div>
  );
}
