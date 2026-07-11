import React from "react";
import { Check, AlertTriangle, Clock } from "lucide-react";

// Standard task-status pill used across every report view (Reports, Daily
// Report) so completed/overdue/in-progress always look identical.
export default function TaskStatusBadge({ status, t }) {
  const tone = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
    overdue: "bg-red-100 text-red-700 border-red-300",
  }[status] || "bg-amber-100 text-amber-700 border-amber-300";

  const Icon = status === "completed" ? Check : status === "overdue" ? AlertTriangle : Clock;
  const label = status === "completed" ? t("completed") : status === "overdue" ? t("overdue") : t("inProgress");

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap ${tone}`}>
      <Icon className="w-2.5 h-2.5" /> {label}
    </span>
  );
}