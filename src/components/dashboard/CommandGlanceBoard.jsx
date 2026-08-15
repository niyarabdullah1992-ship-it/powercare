import React from "react";
import { Link } from "react-router-dom";
import { deriveProofStage } from "@/lib/workProofDerivations";
import { ACCENT, BORDER, CARD, INK, MUTED, NAVY, SURFACE } from "@/lib/platformStyles";

function clock(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function dueLabel(value, ar) {
  if (!value) return ar ? "بدون موعد" : "No due time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const time = clock(date);
  if (sameDay) return ar ? `اليوم ${time}` : `Today ${time}`;
  return `${date.toLocaleDateString(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" })} ${time}`;
}

function isHighPriority(task) {
  const raw = String(task.priority || task.weight || task.severity || "").toLowerCase();
  return raw === "high" || raw === "critical" || raw === "عالية" || Number(task.weight) >= 4;
}

export function buildCommandGlance({
  lang = "ar",
  tasks = [],
  employees = [],
  attendanceRows = [],
  reports = [],
  proofs = [],
  present = 0,
  scheduled = 0,
}) {
  const ar = lang === "ar";
  const open = tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled");
  const inProgress = open.filter((task) => ["in_progress", "active", "started"].includes(String(task.status || "").toLowerCase())).length;
  const pendingProofs = proofs.filter((proof) => {
    const stage = deriveProofStage(proof);
    return stage === "await" || stage === "ready";
  });
  const awaitingTasks = tasks.filter((task) => ["awaiting_approval", "pending_review"].includes(String(task.status || "")));
  const openReports = reports.filter((row) => ["open", "pending", "submitted"].includes(String(row.status || "").toLowerCase()) || !row.approved);
  const urgentReports = openReports.filter((row) => row.urgent || row.priority === "high" || row.level === "red").length;
  const nameById = new Map(employees.map((employee) => [String(employee.id), employee.name]));

  const upcomingTasks = [...open]
    .sort((a, b) => new Date(a.dueDate || a.dueAt || a.endDate || 0) - new Date(b.dueDate || b.dueAt || b.endDate || 0))
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title || task.name || (ar ? "مهمة" : "Task"),
      assignee: nameById.get(String(task.ownerId || task.employeeId || task.assigneeId)) || task.ownerName || task.assignee || (ar ? "غير معيّن" : "Unassigned"),
      priority: isHighPriority(task) ? (ar ? "عالية" : "High") : (task.priority ? (ar ? "متوسطة" : "Medium") : ""),
      priorityTone: isHighPriority(task) ? "high" : "mid",
      due: dueLabel(task.dueDate || task.dueAt || task.endDate, ar),
      to: "/app/tasks",
    }));

  const checkins = attendanceRows
    .filter((row) => row.check_in_at || row.checkInAt)
    .map((row) => {
      const id = String(row.employee_id ?? row.employeeId);
      const when = row.check_in_at || row.checkInAt;
      return {
        id: `in-${row.id || id}-${when}`,
        name: nameById.get(id) || row.employeeName || (ar ? "موظف" : "Staff"),
        meta: row.stationName || row.note || (row.status === "late" ? (ar ? "متأخر — داخل النطاق" : "Late — in range") : (ar ? "داخل النطاق" : "In range")),
        kind: "in",
        action: ar ? "دخول" : "Check-in",
        time: clock(when),
        sort: new Date(when).getTime() || 0,
      };
    });
  const proofRows = pendingProofs.concat(proofs.filter((proof) => deriveProofStage(proof) === "sealed").slice(0, 4))
    .slice(0, 6)
    .map((proof) => ({
      id: `pf-${proof.id}`,
      name: nameById.get(String(proof.employeeId || proof.ownerId)) || proof.ownerName || proof.tech || (ar ? "فني" : "Technician"),
      meta: proof.title || proof.workReason || (ar ? "إثبات عمل" : "Work proof"),
      kind: "proof",
      action: ar ? "إثبات" : "Proof",
      time: clock(proof.afterStamp || proof.beforeStamp || proof.createdAt),
      sort: new Date(proof.createdAt || proof.afterStamp || 0).getTime() || 0,
    }));

  const activity = [...checkins, ...proofRows].sort((a, b) => b.sort - a.sort).slice(0, 6);

  return {
    openTasks: open.length,
    inProgress,
    taskDelta: null,
    present,
    scheduled,
    attendanceDelta: null,
    openReports: openReports.length,
    urgentReports,
    pendingProofs: pendingProofs.length + awaitingTasks.length,
    newProofs: pendingProofs.length,
    upcomingTasks,
    activity,
  };
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "—";
}

function KpiCard({ value, label, hint, badge, badgeTone = "ok", to }) {
  const tone = badgeTone === "warn"
    ? { bg: "rgba(245,158,11,.12)", color: "#B45309" }
    : badgeTone === "bad"
      ? { bg: "rgba(220,38,38,.1)", color: "#DC2626" }
      : { bg: "rgba(30,158,99,.12)", color: "#15803D" };
  const inner = (
    <div
      style={{
        position: "relative",
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "20px 22px 18px",
        minHeight: 118,
        boxShadow: "0 8px 24px rgba(20,40,75,.04)",
      }}
    >
      {badge != null && badge !== "" ? (
        <span
          style={{
            position: "absolute",
            top: 14,
            insetInlineStart: 14,
            minWidth: 28,
            height: 28,
            padding: "0 8px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            background: tone.bg,
            color: tone.color,
            fontFamily: "'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif",
          }}
        >
          {badge}
        </span>
      ) : null}
      <div
        style={{
          fontFamily: "'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif",
          fontSize: 40,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: NAVY,
          marginTop: 8,
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: INK }}>{label}</div>
      {hint ? <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>{hint}</div> : null}
    </div>
  );
  if (!to) return inner;
  return <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>;
}

function Panel({ title, allTo, allLabel, children }) {
  return (
    <section
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(20,40,75,.04)",
        minHeight: 280,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 18px 12px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: INK }}>{title}</h2>
        {allTo ? (
          <Link to={allTo} style={{ fontSize: 12, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
            {allLabel}
          </Link>
        ) : null}
      </header>
      <div>{children}</div>
    </section>
  );
}

export default function CommandGlanceBoard({
  lang = "ar",
  openTasks = 0,
  inProgress = 0,
  taskDelta = null,
  present = 0,
  scheduled = 0,
  attendanceDelta = null,
  openReports = 0,
  urgentReports = 0,
  pendingProofs = 0,
  newProofs = 0,
  upcomingTasks = [],
  activity = [],
}) {
  const ar = lang === "ar";
  const emptyTask = ar ? "لا مهام قريبة ضمن النطاق." : "No upcoming tasks in scope.";
  const emptyLog = ar ? "لا حركة حضور أو إثبات بعد اليوم." : "No attendance or proof activity yet today.";

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1280 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
        className="nv-glance-kpis"
      >
        <KpiCard
          value={openTasks}
          label={ar ? "مهام مفتوحة" : "Open tasks"}
          hint={ar ? `${inProgress} قيد التنفيذ` : `${inProgress} in progress`}
          badge={taskDelta}
          to="/app/tasks"
        />
        <KpiCard
          value={present}
          label={ar ? "الحضور اليوم" : "Attendance today"}
          hint={ar ? `من ${scheduled}` : `of ${scheduled}`}
          badge={attendanceDelta}
          to="/app/attendance"
        />
        <KpiCard
          value={openReports}
          label={ar ? "بلاغات مفتوحة" : "Open reports"}
          hint={ar ? `${urgentReports} عاجل` : `${urgentReports} urgent`}
          badge={urgentReports ? String(urgentReports) : "0"}
          badgeTone={urgentReports ? "bad" : "ok"}
          to="/app/complaints"
        />
        <KpiCard
          value={pendingProofs}
          label={ar ? "إثبات معلّق" : "Pending proof"}
          hint={ar ? "بانتظار الاعتماد" : "Awaiting approval"}
          badge={newProofs ? `${newProofs}+` : "0"}
          badgeTone={newProofs ? "warn" : "ok"}
          to="/app/work-proof"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
        className="nv-glance-lists"
      >
        <Panel title={ar ? "المهام القريبة" : "Upcoming tasks"} allTo="/app/tasks" allLabel={ar ? "عرض الكل" : "View all"}>
          {upcomingTasks.length === 0 ? (
            <p style={{ margin: 0, padding: "8px 18px 22px", fontSize: 13, color: MUTED }}>{emptyTask}</p>
          ) : upcomingTasks.map((task) => (
            <Link
              key={task.id}
              to={task.to || "/app/tasks"}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 18px",
                borderTop: `1px solid ${BORDER}`,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{task.title}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>{task.assignee}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                {task.priority ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: task.priorityTone === "high" ? "#DC2626" : "#B45309",
                      background: task.priorityTone === "high" ? "rgba(220,38,38,.08)" : "rgba(245,158,11,.12)",
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {task.priority}
                  </span>
                ) : null}
                <span style={{ fontSize: 12, color: MUTED }}>{task.due}</span>
              </div>
            </Link>
          ))}
        </Panel>

        <Panel title={ar ? "سجل الحضور والإثبات" : "Attendance and proof log"} allTo="/app/attendance" allLabel={ar ? "عرض الكل" : "View all"}>
          {activity.length === 0 ? (
            <p style={{ margin: 0, padding: "8px 18px 22px", fontSize: 13, color: MUTED }}>{emptyLog}</p>
          ) : activity.map((row) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: NAVY,
                  flexShrink: 0,
                }}
              >
                {initials(row.name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{row.name}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: MUTED }}>{row.meta}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: row.kind === "proof" ? "#B45309" : ACCENT,
                    background: row.kind === "proof" ? "rgba(245,158,11,.12)" : "rgba(30,158,99,.12)",
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  {row.action}
                </span>
                <span style={{ fontSize: 12, color: MUTED }}>{row.time}</span>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .nv-glance-kpis, .nv-glance-lists { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
