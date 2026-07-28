import React from "react";
import { Link } from "react-router-dom";
import { CalendarCheck2, FileBarChart, ListTodo, MapPin, MessageCircle, Users } from "lucide-react";

export default function OperationsModuleGrid({ metrics, lang }) {
  const ar = lang === "ar";
  const items = [
    { icon: MapPin, title: ar ? "المحطات" : "Stations", note: ar ? "محطة تحت المتابعة" : "stations monitored", value: metrics.stations, to: "/app/hr" },
    { icon: ListTodo, title: ar ? "المهام" : "Tasks", note: ar ? `${metrics.completedTasks} مهمة مكتملة` : `${metrics.completedTasks} completed`, value: metrics.tasks, to: "/app/tasks" },
    { icon: MessageCircle, title: ar ? "الشكاوى" : "Complaints", note: ar ? "شكوى مفتوحة" : "open complaints", value: metrics.complaints, to: "/app/complaints" },
    { icon: FileBarChart, title: ar ? "التقارير" : "Reports", note: ar ? `${metrics.pendingReports} بانتظار المراجعة` : `${metrics.pendingReports} awaiting review`, value: metrics.reports, to: "/app/daily-report" },
    { icon: CalendarCheck2, title: ar ? "الحضور" : "Attendance", note: ar ? `${metrics.checkedIn} حاضر اليوم` : `${metrics.checkedIn} present today`, value: `${metrics.attendanceRate}%`, to: "/app/attendance" },
    { icon: Users, title: ar ? "دليل الموظفين" : "Employees", note: ar ? `${metrics.activeMembers} نشط اليوم` : `${metrics.activeMembers} active today`, value: metrics.employees, to: "/app/hr" },
  ];

  return (
    <section aria-label={ar ? "ملخص أقسام المنصة" : "Platform sections overview"}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div><p className="ops-eyebrow">PowerCare Operations</p><h2 className="font-heading text-2xl">{ar ? "نظرة تشغيلية موحدة" : "Unified operations overview"}</h2></div>
        <p className="hidden text-xs text-muted-foreground sm:block">{ar ? "بيانات حية حسب صلاحياتك" : "Live data within your access"}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => <Link key={item.title} to={item.to} className="group relative min-h-36 overflow-hidden rounded-xl border border-accent/30 bg-primary p-4 text-primary-foreground shadow-sm hover:border-accent/70"><span className="absolute end-3 top-3 font-mono text-xs text-accent/70">{String(index + 1).padStart(2, "0")}</span><item.icon className="mb-5 h-7 w-7 text-accent" strokeWidth={1.5} /><h3 className="text-sm font-semibold !text-primary-foreground">{item.title}</h3><div className="mt-2 flex items-end justify-between gap-3"><div><p className="font-heading text-3xl text-primary-foreground">{item.value}</p><p className="mt-1 text-xs text-primary-foreground/55">{item.note}</p></div><span className="h-px w-10 bg-accent/60 transition-all group-hover:w-16" /></div></Link>)}
      </div>
    </section>
  );
}