import React from "react";
import { Bell, CalendarCheck2, ClipboardCheck, Smile, Users } from "lucide-react";

export default function QuickOverviewStrip({ lang, employees, attendance, completedTasks, satisfaction, updates }) {
  const ar = lang === "ar";
  const items = [
    { icon: Users, label: ar ? "إجمالي الموظفين" : "Total employees", value: employees, note: ar ? "ضمن نطاق صلاحياتك" : "Within your access" },
    { icon: CalendarCheck2, label: ar ? "معدل الحضور العام" : "Attendance rate", value: `${attendance}%`, note: ar ? "الحضور المجدول اليوم" : "Scheduled attendance today" },
    { icon: ClipboardCheck, label: ar ? "المهام المكتملة" : "Completed tasks", value: completedTasks, note: ar ? "إجمالي المهام المنجزة" : "Total completed tasks" },
    { icon: Smile, label: ar ? "معدل الرضا الوظيفي" : "Employee satisfaction", value: satisfaction == null ? "—" : `${satisfaction}%`, note: satisfaction == null ? (ar ? "لا توجد تقييمات بعد" : "No ratings yet") : (ar ? "من تقييمات الموظفين" : "From employee ratings") },
    { icon: Bell, label: ar ? "التحديثات الأخيرة" : "Recent updates", value: updates, note: ar ? "آخر الأنشطة المسجلة" : "Latest recorded activity" },
  ];
  return <section className="overflow-hidden rounded-xl border border-accent/30 bg-primary text-primary-foreground shadow-sm" aria-label={ar ? "نظرة عامة سريعة" : "Quick overview"}><div className="grid min-w-[860px] grid-cols-[1.15fr_repeat(5,1fr)] divide-x divide-primary-foreground/10 rtl:divide-x-reverse"><div className="flex flex-col justify-center px-5 py-4"><p className="text-sm font-semibold">{ar ? "نظرة عامة سريعة" : "Quick overview"}</p><p className="mt-1 text-[11px] text-primary-foreground/55">{ar ? "ملخص أداء الموارد البشرية" : "Workforce performance summary"}</p><span className="mt-3 block h-6 w-24 rounded-full border border-accent/20 bg-accent/5" /></div>{items.map(({ icon: Icon, label, value, note }) => <div key={label} className="flex items-center gap-3 px-4 py-4"><Icon className="h-7 w-7 shrink-0 text-accent" strokeWidth={1.5} /><div className="min-w-0"><p className="truncate text-[11px] text-primary-foreground/60">{label}</p><p className="font-heading text-2xl leading-tight text-primary-foreground">{value}</p><p className="truncate text-[9px] text-primary-foreground/40">{note}</p></div></div>)}</div></section>;
}