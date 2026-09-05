import React from "react";
import { Users, ClipboardList, Clock3, ShieldCheck } from "lucide-react";

export default function StationDeleteSummary({ summary, ar }) {
  const items = [
    [Users, summary?.employees || 0, ar ? "الموظفون" : "Employees"],
    [ClipboardList, summary?.openTasks || 0, ar ? "المهام المفتوحة" : "Open tasks"],
    [Clock3, summary?.attendance || 0, ar ? "سجلات الحضور" : "Attendance records"],
    [ShieldCheck, summary?.safety || 0, ar ? "بطاقات السلامة" : "Safety cards"],
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([Icon, value, label]) => (
        <div key={label} className="rounded-lg border border-border bg-muted/50 p-3">
          <Icon className="mb-2 h-4 w-4 text-accent" />
          <p className="font-heading text-xl font-semibold">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}