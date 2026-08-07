import React from "react";
import { Link } from "react-router-dom";
import { ListTodo, ClipboardCheck, Trophy, Banknote, Network } from "lucide-react";

function MetricTile({ to, icon: Icon, label, value, hint }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent/60">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-4.5 w-4.5 text-accent" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] text-muted-foreground">{label}</span>
        <span className="block font-heading text-lg font-bold leading-tight">{value}</span>
        {hint && <span className="block truncate text-[10px] text-muted-foreground">{hint}</span>}
      </span>
    </Link>
  );
}

// أرقام الموظف مباشرة: مهامه، حضوره اليوم، نقاط أدائه، وبند راتبه.
export default function ProfileMetricStrip({ openTasks, todayAttendance, points, netSalary, currency, monthLabel, ar }) {
  const attendanceValue = todayAttendance?.check_in_at
    ? new Date(todayAttendance.check_in_at).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" })
    : (ar ? "لم يسجّل" : "Not in");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricTile to="/app/tasks" icon={ListTodo} label={ar ? "مهامه المفتوحة" : "Open tasks"} value={openTasks ?? "…"} />
      <MetricTile to="/app/attendance" icon={ClipboardCheck} label={ar ? "حضوره اليوم" : "Today's attendance"} value={attendanceValue} hint={todayAttendance?.status} />
      <MetricTile to="/app/performance" icon={Trophy} label={ar ? "نقاط أدائه" : "Performance points"} value={Number(points || 0)} />
      <MetricTile to="/app/payroll" icon={Banknote} label={ar ? "بند راتبه" : "Payroll line"} value={netSalary != null ? `${netSalary.toLocaleString()} ${currency}` : "—"} hint={monthLabel} />
      <MetricTile to="/app/chain" icon={Network} label={ar ? "موقعه في الهيكل" : "Org position"} value={ar ? "عرض" : "View"} />
    </div>
  );
}