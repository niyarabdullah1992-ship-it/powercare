import React from "react";
import { Radio, Users, ListTodo, Megaphone, ShieldCheck, FileText } from "lucide-react";

// Top KPI strip for the executive dashboard — one glance company health.
export default function ExecKpiCards({ stats, lang }) {
  const ar = lang === "ar";
  const cards = [
    { icon: Radio, label: ar ? "المحطات" : "Stations", value: stats.stations, sub: ar ? `${stats.activeStations} نشطة` : `${stats.activeStations} active` },
    { icon: Users, label: ar ? "الموظفون" : "Employees", value: stats.employees, sub: ar ? `${stats.managers} مدير` : `${stats.managers} managers` },
    { icon: ListTodo, label: ar ? "إنجاز المهام" : "Task Completion", value: `${stats.taskCompletion}%`, sub: ar ? `${stats.activeTasks} مهمة جارية` : `${stats.activeTasks} in progress` },
    { icon: Megaphone, label: ar ? "بلاغات مفتوحة" : "Open Reports", value: stats.openComplaints, sub: ar ? "شكاوى وبلاغات" : "complaints & reports", alert: stats.openComplaints > 0 },
    { icon: ShieldCheck, label: ar ? "السلامة" : "Safety", value: stats.safetyRed > 0 ? (ar ? "تحذير" : "Alert") : (ar ? "جيدة" : "Good"), sub: ar ? `${stats.safetyRed} حرجة · ${stats.safetyAmber} متوسطة` : `${stats.safetyRed} critical · ${stats.safetyAmber} amber`, alert: stats.safetyRed > 0 },
    { icon: FileText, label: ar ? "تقارير معلقة" : "Pending Reports", value: stats.pendingReports, sub: ar ? "بانتظار الاعتماد" : "awaiting approval" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.alert ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
            <c.icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <p className="mt-3 font-heading text-2xl font-semibold leading-none">{c.value}</p>
          <p className="mt-1.5 text-xs font-body font-medium text-foreground/80">{c.label}</p>
          <p className="text-[11px] font-body text-muted-foreground">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}