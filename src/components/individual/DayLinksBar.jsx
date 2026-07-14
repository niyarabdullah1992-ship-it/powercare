import React from "react";
import { Link } from "react-router-dom";
import { Target, CalendarDays, MapPin, BookOpen } from "lucide-react";

// "Day at a glance" strip that ties the individual sections together:
// tasks due, planner progress, visits and journal for a given date — each
// chip links to its section.
export default function DayLinksBar({ date, data, targets = [], ar, hide = [] }) {
  const plans = (data.plannerItems || []).filter((i) => i.date === date);
  const done = plans.filter((i) => i.done).length;
  const tasksDue = targets.filter((tg) => tg.status !== "completed" && (tg.end_date || "").slice(0, 10) === date);
  const visits = (data.personalAttendance || []).filter((r) => r.date === date);
  const journal = (data.journalEntries || []).filter((e) => e.date === date);

  const chips = [
    { key: "tasks", to: "/app/tasks", icon: Target, color: "text-amber-700 bg-amber-50 border-amber-200", label: ar ? `مهام مستحقة: ${tasksDue.length}` : `Tasks due: ${tasksDue.length}` },
    { key: "planner", to: "/app/planner", icon: CalendarDays, color: "text-accent bg-accent/10 border-accent/30", label: ar ? `الخطة: ${done}/${plans.length}` : `Plan: ${done}/${plans.length}` },
    { key: "visits", to: "/app/attendance", icon: MapPin, color: "text-sky-700 bg-sky-50 border-sky-200", label: ar ? `زيارات: ${visits.length}` : `Visits: ${visits.length}` },
    { key: "journal", to: "/app/journal", icon: BookOpen, color: "text-emerald-700 bg-emerald-50 border-emerald-200", label: journal.length ? (ar ? "اليوميات ✓" : "Journal ✓") : (ar ? "لا يوميات بعد" : "No journal yet") },
  ].filter((c) => !hide.includes(c.key));

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <Link key={c.key} to={c.to} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-body transition hover:opacity-80 ${c.color}`}>
          <c.icon className="w-3.5 h-3.5" /> {c.label}
        </Link>
      ))}
    </div>
  );
}