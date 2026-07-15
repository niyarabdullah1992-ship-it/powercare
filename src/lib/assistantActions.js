import { updateCompany } from "@/lib/store";
import { buildAssistantContext } from "./assistantContext";
import { printReport } from "@/lib/printReport";
import { generateSignedReport } from "@/lib/signedReport";
import { base44 } from "@/api/base44Client";
import { exportExcelColored } from "@/lib/exportExcelColored";

// Executes real actions requested by the AI assistant (exports, task creation, status updates).
// Every write action is permission-gated; exports only include data the user can already see.

const WRITE_ROLES = ["director", "ops_manager", "pgm", "station_manager"];

function downloadCSV(filename, rows) {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  return true;
}

const norm = (s) => String(s || "").trim().toLowerCase();
const matches = (a, b) => norm(a).includes(norm(b)) || norm(b).includes(norm(a));

async function datasetRows(action, data, currentUser) {
  const ctx = buildAssistantContext(data, currentUser);
  const dataset = norm(action.dataset);
  if (dataset === "attendance") {
    const ids = ctx.employees.map((e) => e.id);
    if (!ids.length) return [];
    const res = await base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: ids });
    return (res?.data?.rows || []).map((r) => ({ employee: r.employee_name, status: r.status, checkIn: r.check_in_at, checkOut: r.check_out_at, workHours: r.work_hours, location: r.location_status }));
  }
  const map = {
    employees: ctx.employees.map(({ id, ...e }) => e),
    tasks: ctx.tasks,
    targets: ctx.targets,
    reports: ctx.dailyReports.map(({ content, ...r }) => r),
    stations: ctx.stations,
    safety: ctx.safety.map((s) => ({ ...s, hazards: (s.hazards || []).join(" | ") })),
    plans: ctx.plans,
    schedules: ctx.schedules,
    complaints: ctx.complaints,
    files: ctx.files,
    hr: ctx.hrStructure,
    leaves: ctx.employeeDetails.map((e) => ({ employee: e.employee, leaveRequests: e.leaveRequests })),
    certificates: ctx.employeeDetails.map((e) => ({ employee: e.employee, certificates: e.certificates })),
    performance: ctx.employees.map(({ id, name, station, points }) => ({ name, station, points })),
  };
  return map[dataset];
}

export async function executeAssistantAction(action, { data, company, currentUser, t }) {
  const canWrite = WRITE_ROLES.includes(currentUser.role);

  if (action.type === "export_data") {
    const dataset = norm(action.dataset);
    const rows = await datasetRows(action, data, currentUser);
    const isBlankSchedule = dataset === "schedules" && (!rows || !rows.length);
    if ((!rows || !rows.length) && !isBlankSchedule) return { ok: false, message: t("aiNoData") };

    const headers = isBlankSchedule
      ? [t("employeeName"), t("station"), t("date"), t("shift"), t("workStartTime"), t("workEndTime")]
      : Object.keys(rows[0]);
    const tableRows = isBlankSchedule
      ? Array.from({ length: 12 }, () => headers.map(() => ""))
      : rows.map((r) => Object.values(r));

    if (norm(action.format) === "pdf") {
      printReport({
        title: action.reportTitle || dataset,
        companyName: data.name || "",
        periodLabel: new Date().toLocaleDateString(document.documentElement.dir === "rtl" ? "ar" : "en-GB"),
        dir: document.documentElement.dir,
        sections: [{ heading: action.reportTitle || dataset, headers, rows: tableRows }],
        logoUrl: data.reportBranding?.logoUrl || "",
        color: data.reportBranding?.color || "#b07d3f",
      });
      return { ok: true, message: t("aiPdfDone") };
    }
    exportExcelColored({
      filename: `${dataset}_${new Date().toISOString().slice(0, 10)}`,
      title: action.reportTitle || dataset,
      headers,
      rows: tableRows,
      color: data.reportBranding?.color || "#b07d3f",
      dir: document.documentElement.dir,
    });
    return { ok: true, message: t("aiExportDone") };
  }

  if (action.type === "sign_report") {
    const rows = await datasetRows(action, data, currentUser);
    if (!rows || !rows.length) return { ok: false, message: t("aiNoData") };
    const { verificationId } = await generateSignedReport({
      title: action.reportTitle || action.dataset,
      companyName: data.name || "",
      dir: document.documentElement.dir,
      headers: Object.keys(rows[0]),
      rows: rows.map((r) => Object.values(r)),
      signerName: currentUser?.profile?.signatureName || currentUser.name,
      signatureUrl: currentUser?.profile?.signatureUrl || "",
      signerId: currentUser.id,
      companyId: company.id,
      logoUrl: data.reportBranding?.logoUrl || "",
    });
    return { ok: true, message: `${t("aiReportSigned")} ${verificationId}` };
  }

  if (action.type === "open_page") {
    const routes = {
      dashboard: "/app", tasks: "/app/tasks", attendance: "/app/attendance",
      reports: "/app/reports", performance: "/app/performance", employees: "/app/employees",
      stations: "/app/stations", hr: "/app/hr", complaints: "/app/complaints",
      chat: "/app/chat", files: "/app/files", daily_report: "/app/daily-report",
      help: "/app/help", signing: "/app/signing", verify: "/verify",
      planner: "/app/planner", journal: "/app/journal", calendar: "/app/calendar",
    };
    const path = routes[norm(action.page)];
    if (!path) return { ok: false, message: t("aiActionFailed") };
    window.open(path, "_blank");
    return { ok: true, message: t("aiOpeningPage") };
  }

  if (action.type === "create_task") {
    if (!canWrite) return { ok: false, message: t("aiNoPermission") };
    const station = data.stations.find((s) => matches(s.name, action.station || ""));
    const assignee = data.employees.find((e) => matches(e.name, action.assignee || ""));
    const assignmentType = assignee ? "member" : station ? "station_team" : "hq_team";
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "createTarget",
        userRole: currentUser.role,
        managerId: currentUser.id,
        title: action.title || "Untitled task",
        description: action.description || "",
        steps: action.steps || "",
        section: action.section || "",
        taskTarget: Number(action.taskTarget || action.dailyTarget) || 1,
        assignmentType,
        assignmentId: assignee ? assignee.id : station ? station.id : null,
        employeeId: assignee?.id || null,
        stationId: assignee ? (assignee.stationId || null) : (station?.id || null),
        priority: ["urgent", "high", "medium", "low"].includes(action.priority) ? action.priority : "medium",
        days: Number(action.days) > 0 ? Number(action.days) : 30,
      });
      if (res?.data?.target) return { ok: true, message: t("aiTaskCreated") };
      return { ok: false, message: res?.data?.error || t("aiActionFailed") };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.error || t("aiActionFailed") };
    }
  }

  if (action.type === "log_progress") {
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "listTargets",
        userRole: currentUser.role,
        userId: currentUser.id,
        stationId: currentUser.stationId || null,
        managedStations: currentUser.managedStations || [],
      });
      const tg = (res?.data?.targets || []).find((x) => matches(x.title, action.taskTitle || ""));
      if (!tg) return { ok: false, message: t("aiNoData") };
      await base44.functions.invoke("supabaseTargets", {
        action: "updateProgress",
        targetId: tg.id,
        amount: Number(action.amount) || 1,
        userId: currentUser.id,
        managerId: tg.manager_id,
        employeeName: currentUser.name,
        proofFiles: [],
      });
      return { ok: true, message: t("aiStatusUpdated") };
    } catch (err) {
      const code = err?.response?.data?.error;
      return { ok: false, message: code === "PROOF_REQUIRED" ? t("proofRequired") : (code || t("aiActionFailed")) };
    }
  }

  if (action.type === "add_planner_item") {
    if (!action.title) return { ok: false, message: t("aiActionFailed") };
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(action.date || "") ? action.date : today;
    updateCompany(company.id, (d) => {
      d.plannerItems = d.plannerItems || [];
      d.plannerItems.push({
        id: "pln_" + Math.random().toString(36).slice(2, 11),
        date,
        time: /^\d{2}:\d{2}$/.test(action.time || "") ? action.time : "",
        title: action.title,
        done: false,
        createdAt: new Date().toISOString(),
      });
    });
    return { ok: true, message: `${t("dayPlanner")}: ${action.title} ✔` };
  }

  if (action.type === "update_task_status") {
    if (!canWrite) return { ok: false, message: t("aiNoPermission") };
    const valid = ["pending", "in_progress", "completed", "stopped"];
    if (!valid.includes(action.newStatus)) return { ok: false, message: t("aiActionFailed") };
    let found = false;
    updateCompany(company.id, (d) => {
      const task = d.tasks.find((tk) => matches(tk.title, action.taskTitle || ""));
      if (task) {
        task.status = action.newStatus;
        if (action.newStatus === "completed") task.progress = task.dailyTarget || task.progress;
        found = true;
      }
    });
    return found ? { ok: true, message: t("aiStatusUpdated") } : { ok: false, message: t("aiNoData") };
  }

  return { ok: false, message: t("aiActionFailed") };
}