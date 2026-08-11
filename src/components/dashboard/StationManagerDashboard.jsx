import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { visibleStations } from "@/lib/permissions";
import { useAuth } from "@/lib/PowerCareAuth";
import { isActiveAttendance } from "@/lib/attendance";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import { isScheduledToday } from "@/lib/attendance";
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
  const team = data.employees.filter((employee) =>
    stationIds.has(stationIdForTreeEmployee(data, employee.id) || employee.stationId || defaultStationId),
  );
  const tasks = data.tasks.filter((tk) => stationIds.has(tk.stationId));
  const reports = data.reports.filter((r) => stationIds.has(r.stationId));
  const pendingReports = reports.filter((r) => r.status === "pending");
  const completed = tasks.filter((tk) => tk.status === "completed").length;

  useEffect(() => {
    if (!team.length) return;
    base44.functions
      .invoke("supabaseAttendance", { action: "listDaily", employeeIds: team.map((e) => e.id) })
      .then((res) => setAttendanceRows(res?.data?.rows || []))
      .catch(() => setAttendanceRows([]));
  }, [team.map((e) => e.id).join(",")]);

  const scheduled = team.filter((employee) => isScheduledToday(employee, data) && !isOnLeaveToday(employee));
  const scheduledIds = new Set(scheduled.map((e) => e.id));
  const checkedInCount = attendanceRows.filter((row) => isActiveAttendance(row) && scheduledIds.has(row.employee_id)).length;
  const attendanceRate = scheduled.length ? Math.round((checkedInCount / scheduled.length) * 100) : 0;
  const absentCount = Math.max(0, scheduled.length - checkedInCount);

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
        type: ar ? (request.typeAr || request.type || "إجازة") : (request.type || "Leave"),
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
    { label: ar ? "حضور" : "Attendance", pct: attendanceRate },
    { label: ar ? "مهام" : "Tasks", pct: tasks.length ? Math.round((completed / tasks.length) * 100) : 100 },
    { label: ar ? "سلامة" : "Safety", pct: Math.max(0, 100 - openHazards * 12 - criticalStations * 20) },
    { label: ar ? "اعتمادات" : "Approvals", pct: Math.max(0, 100 - (pendingLeaveCount + pendingReports.length) * 8) },
  ];

  const handoffAlerts = [
    ...(delayedTasks ? [{ text: ar ? `${delayedTasks} مهمة تقترب من موعدها أو متأخرة.` : `${delayedTasks} tasks due soon or overdue.`, to: "/app/tasks" }] : []),
    ...(absentCount ? [{ text: ar ? `${absentCount} من المجدولين لم يسجّلوا حضورًا بعد.` : `${absentCount} scheduled staff not checked in yet.`, to: "/app/attendance" }] : []),
    ...(pendingReports.length ? [{ text: ar ? `${pendingReports.length} تقرير يومي بانتظار الاعتماد.` : `${pendingReports.length} daily reports awaiting approval.`, to: "/app/daily-report" }] : []),
    ...(openHazards ? [{ text: ar ? `${openHazards} مخاطر سلامة بانتظار الإغلاق.` : `${openHazards} open safety hazards awaiting closure.`, to: "/app/safety" }] : []),
    ...(stoppageCount ? [{ text: ar ? `${stoppageCount} عوائق تشغيل معلّمة على المهام.` : `${stoppageCount} stoppage issues flagged on tasks.`, to: "/app/tasks" }] : []),
  ].slice(0, 4);

  const monthHired = team.filter((e) => {
    const d = new Date(e.createdAt || e.hiredAt || e.startDate || 0);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <div className="space-y-4">
      <QuickCheckInCard currentUser={user} company={company} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] font-semibold tracking-[0.12em] text-[#0E7A4B]">
            {ar ? "محطتي" : "MY STATION"}
          </p>
          <h1 className="m-0 mt-1 font-heading text-2xl font-semibold text-[#14284B]">
            {stations.length === 1 ? stations[0].name : (ar ? "قيادة المحطة" : "Station command")}
          </h1>
          <p className="m-0 mt-1 text-[13px] text-[#667085]">
            {ar
              ? `${stations.length} محطة في نطاقك · قرارات اليوم قبل إغلاق الورديات`
              : `${stations.length} stations in scope · today's decisions before shift close`}
          </p>
        </div>
        <Link
          to="/app/attendance"
          className="rounded-lg border border-[#E4E7EC] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#344054] hover:border-[#0E7A4B] hover:text-[#0E7A4B]"
        >
          {ar ? "كشف الحضور" : "Attendance roster"}
        </Link>
      </div>

      <HandoffCommandBoard
        lang={lang}
        readinessScore={readinessScore}
        factors={readinessFactors}
        employeesCount={team.length}
        employeesDelta={monthHired || null}
        attendanceRate={attendanceRate}
        pendingLeave={pendingLeaveCount}
        pendingReports={pendingReports.length}
        leaveQueue={handoffQueue}
        alerts={handoffAlerts}
        stationsCount={stations.length}
        openHazards={openHazards}
        payrollCount={team.length}
        avgApprovalHours={pendingLeaveCount + pendingReports.length > 0 ? 4 : null}
      />
    </div>
  );
}
