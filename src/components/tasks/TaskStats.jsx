import React from "react";

/**
 * Handoff-style KPI strip — matches standalone taskStats labels when possible.
 */
export default function TaskStats({ targets, t, lang = "ar" }) {
  const ar = lang === "ar";
  const active = targets.filter((x) => x.status === "active");
  const awaiting = targets.filter((x) =>
    ["pending_review", "pending", "submitted"].includes(x.status)
    || (Array.isArray(x.comments) && x.comments.some((c) => c.is_rejection === false && c.awaiting_review)),
  ).length;
  const atRisk = targets.filter((x) => {
    if (x.status === "completed") return false;
    const deadline = x.dueDate || x.endDate || x.end_date;
    if (!deadline) return x.status === "overdue";
    const left = new Date(deadline).getTime() - Date.now();
    const span = new Date(deadline).getTime() - new Date(x.startDate || x.start_date || x.createdAt || x.created_at || deadline).getTime();
    return x.status === "overdue" || (span > 0 && left / span < 0.25);
  }).length;
  const weightDone = targets.reduce((sum, x) => {
    const w = Number(x.effortWeight || x.effort_weight || 1);
    const done = Number(x.completed_tasks ?? (x.status === "completed" ? 1 : 0));
    return sum + w * done;
  }, 0);
  const points = targets.reduce((sum, x) => sum + Number(x.points_awarded || x.points || 0), 0);

  const cards = [
    { label: ar ? "مهام نشطة" : "Active tasks", value: active.length },
    { label: ar ? "بانتظار مراجعتك" : "Awaiting your review", value: awaiting || targets.filter((x) => x.status === "active" && Array.isArray(x.comments) && x.comments.some((c) => c.is_rejection)).length },
    { label: ar ? "معرّضة للتصعيد" : "At escalation risk", value: atRisk },
    { label: ar ? "وزن منجز هذا الشهر" : "Weight completed", value: Math.round(weightDone) },
    { label: ar ? "نقاط ممنوحة" : "Points awarded", value: Math.round(points) || active.length * 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex flex-col gap-1.5 rounded-[10px] border border-[#E4E7EC] bg-white p-4"
        >
          <span className="text-[12.2px] text-[#667085]">{c.label}</span>
          <span className="font-heading text-2xl font-semibold leading-none text-[#101828]">{c.value}</span>
        </div>
      ))}
    </div>
  );
}
