import React from "react";
import { Link } from "react-router-dom";
import { Banknote, Bot, CalendarCheck2, CircleHelp, FileBarChart, FolderOpen, ListTodo, MapPin, MessageCircle, MessagesSquare, Package, PenTool, ReceiptText, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { canAccessPath } from "@/lib/navVisibility";

export default function OperationsModuleGrid({ metrics, lang, user, data, company }) {
  const ar = lang === "ar";
  const items = [
    { icon: MapPin, title: ar ? "المحطات" : "Stations", note: ar ? "محطة تحت المتابعة" : "stations monitored", value: metrics.stations, to: "/app/hr" },
    { icon: ListTodo, title: ar ? "المهام" : "Tasks", note: ar ? `${metrics.completedTasks} مهمة مكتملة` : `${metrics.completedTasks} completed`, value: metrics.tasks, to: "/app/tasks" },
    { icon: MessageCircle, title: ar ? "الشكاوى" : "Complaints", note: ar ? "شكوى مفتوحة" : "open complaints", value: metrics.complaints, to: "/app/complaints" },
    { icon: FileBarChart, title: ar ? "التقارير" : "Reports", note: ar ? `${metrics.pendingReports} بانتظار المراجعة` : `${metrics.pendingReports} awaiting review`, value: metrics.reports, to: "/app/daily-report" },
    { icon: Banknote, title: ar ? "الرواتب" : "Payroll", note: ar ? "سجلات الرواتب" : "payroll records", value: metrics.payroll, to: "/app/payroll" },
    { icon: CalendarCheck2, title: ar ? "الحضور والجداول" : "Attendance", note: ar ? `${metrics.checkedIn} حاضر اليوم` : `${metrics.checkedIn} present today`, value: `${metrics.attendanceRate}%`, to: "/app/attendance" },
    { icon: PenTool, title: ar ? "التوقيع الرقمي" : "Digital signing", note: ar ? "مستندات التوقيع" : "signing documents", value: metrics.signing, to: "/app/signing" },
    { icon: Bot, title: ar ? "المساعد الذكي" : "AI assistant", note: ar ? "نيرو جاهز للمساعدة" : "Niro is ready", value: ar ? "جاهز" : "Ready", to: "/app/assistant" },
    { icon: TrendingUp, title: ar ? "الأداء الوظيفي" : "Performance", note: ar ? "معدل إنجاز المهام" : "task completion rate", value: `${metrics.performance}%`, to: "/app/performance" },
    { icon: Users, title: ar ? "دليل الموظفين" : "Employees", note: ar ? `${metrics.activeMembers} نشط اليوم` : `${metrics.activeMembers} active today`, value: metrics.employees, to: "/app/hr" },
    { icon: ShieldCheck, title: ar ? "السلامة" : "Safety", note: ar ? `${metrics.hazards} مخاطر مفتوحة` : `${metrics.hazards} open hazards`, value: metrics.safety, to: "/app/safety" },
    { icon: ReceiptText, title: ar ? "المصروفات" : "Expenses", note: ar ? "مطالبات المصروفات" : "expense claims", value: metrics.expenses, to: "/app/expenses" },
    { icon: Package, title: ar ? "المخزون" : "Inventory", note: ar ? "مواد ووحدات مخزون" : "stock items and units", value: metrics.inventory, to: "/app/inventory" },
    { icon: FolderOpen, title: ar ? "المستندات" : "Documents", note: ar ? "ملفات محفوظة" : "stored files", value: metrics.files, to: "/app/files" },
    { icon: MessagesSquare, title: ar ? "الرسائل" : "Messages", note: ar ? "قنوات التواصل الداخلي" : "internal communication", value: metrics.messages, to: "/app/chat" },
    { icon: CircleHelp, title: ar ? "المساعدة" : "Help", note: ar ? "دليل ودعم المنصة" : "platform guide and support", value: "24/7", to: "/app/help" },
  ].filter((item) => canAccessPath(item.to, user, data, company));

  return (
    <section aria-label={ar ? "ملخص أقسام المنصة" : "Platform sections overview"}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div><p className="ops-eyebrow">PowerCare Operations</p><h2 className="font-heading text-2xl">{ar ? "لوحة التحكم الرئيسية" : "Main control dashboard"}</h2></div>
        <p className="hidden text-xs text-muted-foreground sm:block">{ar ? "بيانات حية حسب صلاحياتك" : "Live data within your access"}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((item, index) => <Link key={item.title} to={item.to} className="group relative min-h-32 overflow-hidden rounded-xl border border-accent/30 bg-primary p-4 text-primary-foreground shadow-sm hover:border-accent/70"><span className="absolute end-3 top-3 font-mono text-xs text-accent/70">{String(index + 1).padStart(2, "0")}</span><item.icon className="mb-5 h-7 w-7 text-accent" strokeWidth={1.5} /><h3 className="text-sm font-semibold !text-primary-foreground">{item.title}</h3><div className="mt-2 flex items-end justify-between gap-3"><div><p className="font-heading text-3xl text-primary-foreground">{item.value}</p><p className="mt-1 text-xs text-primary-foreground/55">{item.note}</p></div><span className="h-px w-10 bg-accent/60 transition-all group-hover:w-16" /></div></Link>)}
      </div>
    </section>
  );
}