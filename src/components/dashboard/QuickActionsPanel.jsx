import React from "react";
import { Link } from "react-router-dom";
import { Zap, ListTodo, PenLine, FileText, CalendarDays, Clock } from "lucide-react";
import QuickAttendanceButton from "@/components/dashboard/QuickAttendanceButton";
import QuickTaskList from "@/components/dashboard/QuickTaskList";

// Dashboard quick-actions hub: one-tap attendance, +1 task progress, and
// shortcut chips to the most-used services — no page hopping needed.
export default function QuickActionsPanel({ currentUser, company, data, targets, t, lang, isIndividual }) {
  const ar = lang === "ar";
  const links = [
    { to: "/app/tasks", icon: ListTodo, label: t("myTasks") },
    { to: "/app/signing", icon: PenLine, label: ar ? "توقيع مستند" : "Sign document" },
    isIndividual
      ? { to: "/app/planner", icon: CalendarDays, label: ar ? "خطة اليوم" : "Day planner" }
      : { to: "/app/daily-report", icon: FileText, label: ar ? "تقرير يومي" : "Daily report" },
    { to: "/app/attendance", icon: Clock, label: t("myAttendance") },
  ];

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" /> {ar ? "إجراءات سريعة" : "Quick actions"}
        </h3>
        {!isIndividual && currentUser.stationId && (
          <QuickAttendanceButton currentUser={currentUser} company={company} data={data} t={t} />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border text-xs font-body hover:bg-muted hover:border-accent/40 transition"
          >
            <Icon className="w-3.5 h-3.5 text-accent" /> {label}
          </Link>
        ))}
      </div>

      <QuickTaskList targets={targets} currentUser={currentUser} data={data} company={company} t={t} ar={ar} />
    </div>
  );
}