import React from "react";
import { Users, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function minutesBetween(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

export default function ScheduleStatsBar({ employees, shiftTypes, assignments, monthDates }) {
  const { t } = useI18n();
  const days = monthDates || [];
  let scheduledMinutes = 0;
  let filledCells = 0;
  const totalCells = days.length * shiftTypes.length;

  days.forEach((d) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    shiftTypes.forEach((st) => {
      const ids = assignments?.[key]?.[st.id] || [];
      if (ids.length > 0) filledCells++;
      scheduledMinutes += ids.length * minutesBetween(st.start, st.end);
    });
  });
  const coverage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
  const openShifts = totalCells - filledCells;

  const stats = [
    { icon: Users, value: employees.length, sub: t("activeEmployees") },
    { icon: Clock, value: `${Math.round(scheduledMinutes / 60)}h`, sub: t("thisMonth") },
    { icon: ShieldCheck, value: `${coverage}%`, sub: coverage >= 90 ? t("excellent") : t("coverageRate") },
    { icon: AlertCircle, value: openShifts, sub: t("needCoverage") },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <span className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <s.icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold leading-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground font-body truncate">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}