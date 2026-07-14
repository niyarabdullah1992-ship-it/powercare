import React from "react";
import { Link } from "react-router-dom";
import { ListTodo, PenLine, Sparkles, FolderOpen, CheckCircle2, Clock, CalendarDays, ClipboardCheck, BookOpen } from "lucide-react";
import StreakCard from "@/components/individual/StreakCard";

export default function IndividualDashboard({ data, lang }) {
  const ar = lang === "ar";
  const tasks = data.tasks || [];
  const completed = tasks.filter((tk) => tk.status === "completed").length;
  const pending = tasks.length - completed;

  const stats = [
    { icon: ListTodo, label: ar ? "إجمالي المهام" : "Total tasks", value: tasks.length, color: "text-accent" },
    { icon: CheckCircle2, label: ar ? "مكتملة" : "Completed", value: completed, color: "text-emerald-600" },
    { icon: Clock, label: ar ? "قيد التنفيذ" : "Pending", value: pending, color: "text-amber-600" },
  ];

  const shortcuts = [
    { to: "/app/tasks", icon: ListTodo, title: ar ? "مهامي" : "My Tasks", desc: ar ? "نظّم مهامك اليومية في مجلدات" : "Organize your daily tasks in folders" },
    { to: "/app/planner", icon: CalendarDays, title: ar ? "جدولي اليومي" : "Day Planner", desc: ar ? "رتّب يومك ونظّم وقتك ساعة بساعة" : "Plan and organize your day hour by hour" },
    { to: "/app/attendance", icon: ClipboardCheck, title: ar ? "حضوري" : "My Attendance", desc: ar ? "سجّل حضورك لمقرك وتابع ساعاتك ووقت دخولك وخروجك" : "Check in at your own place and track your hours in and out" },
    { to: "/app/journal", icon: BookOpen, title: ar ? "تقارير حياتي" : "My Life Journal", desc: ar ? "سجّل تقرير يومك وحالتك وراجع سجل حياتك" : "Record your daily report and mood, and look back at your life log" },
    { to: "/app/signing", icon: PenLine, title: ar ? "التوقيع الرقمي" : "Digital Signing", desc: ar ? "وقّع مستنداتك بشارة تحقق مشفّرة" : "Sign documents with an encrypted verification badge" },
    { to: "/app/assistant", icon: Sparkles, title: ar ? "المساعد الذكي" : "AI Assistant", desc: ar ? "اسأل Niro لتنظيم يومك وإنجاز أعمالك" : "Ask Niro to organize your day and get things done" },
    { to: "/app/files", icon: FolderOpen, title: ar ? "ملفاتي" : "My Files", desc: ar ? "احفظ ونظّم مستنداتك الخاصة" : "Store and organize your personal documents" },
  ];

  return (
    <div className="space-y-6">
      <StreakCard data={data} ar={ar} />
      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border shadow-sm divide-x divide-border rtl:divide-x-reverse">
        {stats.map((s) => (
          <div key={s.label} className="p-5 bg-card text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} strokeWidth={1.5} />
            <p className="hero-title text-3xl">{s.value}</p>
            <p className="text-[10px] tracking-widest-xl uppercase text-muted-foreground font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {shortcuts.map((sc) => (
          <Link key={sc.to} to={sc.to} className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-accent/40 hover:shadow-md transition-all">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent mb-3">
              <sc.icon className="w-5 h-5" strokeWidth={1.5} />
            </span>
            <h3 className="font-heading text-lg font-semibold">{sc.title}</h3>
            <p className="text-sm text-muted-foreground font-body mt-1">{sc.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}