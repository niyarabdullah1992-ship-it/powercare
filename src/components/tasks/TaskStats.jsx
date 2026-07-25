import React from "react";
import { Target, Clock, CheckCircle, AlertTriangle, Zap } from "lucide-react";

export default function TaskStats({ targets, t }) {
  const total = targets.length;
  const active = targets.filter((x) => x.status === "active").length;
  const completed = targets.filter((x) => x.status === "completed").length;
  const overdue = targets.filter((x) => x.status === "overdue").length;
  const urgent = targets.filter((x) => x.priority === "urgent" && x.status === "active").length;

  const cards = [
    { label: t("total"), value: total, icon: Target, color: "text-accent", bg: "bg-primary" },
    { label: t("inProgress"), value: active, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: t("completed"), value: completed, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: t("overdue"), value: overdue, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: t("urgent"), value: urgent, icon: Zap, color: "text-red-700", bg: "bg-red-100" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="flex items-center gap-3 rounded-xl border border-accent/20 bg-card p-4 shadow-soft">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
            <c.icon className={`w-5 h-5 ${c.color}`} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-heading font-semibold leading-none">{c.value}</p>
            <p className="text-xs text-muted-foreground font-body mt-1 truncate">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}