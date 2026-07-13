import { updateCompany } from "@/lib/store";
import { buildAssistantContext } from "./assistantContext";
import { printReport } from "@/lib/printReport";
import { generateSignedReport } from "@/lib/signedReport";

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

function datasetRows(action, data, currentUser) {
  const ctx = buildAssistantContext(data, currentUser);
  const map = {
    employees: ctx.employees,
    tasks: ctx.tasks,
    reports: ctx.dailyReports.map(({ content, ...r }) => r),
    stations: ctx.stations,
    safety: ctx.safety.map((s) => ({ ...s, hazards: (s.hazards || []).join(" | ") })),
  };
  return map[norm(action.dataset)];
}

export async function executeAssistantAction(action, { data, company, currentUser, t }) {
  const canWrite = WRITE_ROLES.includes(currentUser.role);

  if (action.type === "export_data") {
    const dataset = norm(action.dataset);
    const rows = datasetRows(action, data, currentUser);
    if (!rows || !rows.length) return { ok: false, message: t("aiNoData") };
    if (norm(action.format) === "pdf") {
      printReport({
        title: action.reportTitle || dataset,
        companyName: data.name || "",
        periodLabel: new Date().toLocaleDateString(document.documentElement.dir === "rtl" ? "ar" : "en-GB"),
        dir: document.documentElement.dir,
        sections: [{ heading: action.reportTitle || dataset, headers: Object.keys(rows[0]), rows: rows.map((r) => Object.values(r)) }],
      });
      return { ok: true, message: t("aiPdfDone") };
    }
    downloadCSV(`${dataset}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    return { ok: true, message: t("aiExportDone") };
  }

  if (action.type === "sign_report") {
    const rows = datasetRows(action, data, currentUser);
    if (!rows || !rows.length) return { ok: false, message: t("aiNoData") };
    const { verificationId } = await generateSignedReport({
      title: action.reportTitle || action.dataset,
      companyName: data.name || "",
      dir: document.documentElement.dir,
      headers: Object.keys(rows[0]),
      rows: rows.map((r) => Object.values(r)),
      signerName: currentUser?.profile?.signatureName || currentUser.name,
      signerId: currentUser.id,
      companyId: company.id,
    });
    return { ok: true, message: `${t("aiReportSigned")} ${verificationId}` };
  }

  if (action.type === "open_page") {
    const routes = { signing: "/app/signing", verify: "/verify" };
    const path = routes[norm(action.page)];
    if (!path) return { ok: false, message: t("aiActionFailed") };
    window.open(path, "_blank");
    return { ok: true, message: t("aiOpeningPage") };
  }

  if (action.type === "create_task") {
    if (!canWrite) return { ok: false, message: t("aiNoPermission") };
    const station = data.stations.find((s) => matches(s.name, action.station || ""));
    const assignee = data.employees.find((e) => matches(e.name, action.assignee || ""));
    updateCompany(company.id, (d) => {
      d.tasks.push({
        id: "task_" + Math.random().toString(36).slice(2, 11),
        title: action.title || "Untitled task",
        description: action.description || "",
        stationId: station?.id || null,
        assignedTo: assignee?.id || null,
        status: "pending",
        dailyTarget: Number(action.dailyTarget) || 1,
        progress: 0,
        stops: [],
        createdAt: new Date().toISOString(),
      });
    });
    return { ok: true, message: t("aiTaskCreated") };
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