import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Boxes, Clock3, UserX, ListTodo } from "lucide-react";

const icons = { stock: Boxes, requests: Clock3, absence: UserX, tasks: ListTodo };
const labels = {
  ar: { stock: "مخزون ناقص", requests: "طلبات متأخرة الصرف", absence: "غياب غير مبرر", tasks: "مهام متأخرة" },
  en: { stock: "Low stock", requests: "Delayed approved requests", absence: "Unexcused absences", tasks: "Overdue tasks" },
};

export default function OperationalAlerts({ alerts, loading, lang }) {
  const navigate = useNavigate();
  const ar = lang === "ar";
  return (
    <section className="rounded-2xl border border-amber-500/35 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
        <div><h2 className="font-heading text-2xl font-semibold">{ar ? "تنبيهات تشغيلية" : "Operational alerts"}</h2><p className="text-xs text-muted-foreground">{ar ? "المشاكل التي تحتاج إلى انتباهك الآن" : "Issues that need your attention now"}</p></div>
      </div>
      {loading ? <div className="h-16 animate-pulse rounded-xl bg-muted" /> : alerts.length === 0 ? <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{ar ? "لا توجد مشاكل تشغيلية حالياً." : "No operational issues right now."}</p> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{alerts.map((alert) => { const Icon = icons[alert.category] || AlertTriangle; return <button key={alert.id} onClick={() => navigate(alert.to)} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-start hover:border-amber-500/50"><Icon className="h-5 w-5 shrink-0 text-amber-700" /><span className="min-w-0"><strong className="block text-2xl leading-none">{alert.count}</strong><span className="mt-1 block text-xs text-muted-foreground">{labels[ar ? "ar" : "en"][alert.category]}</span></span></button>; })}</div>
      )}
    </section>
  );
}