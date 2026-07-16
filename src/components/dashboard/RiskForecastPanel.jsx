import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock3, Flame, HardHat, ShieldAlert, UserRoundX } from "lucide-react";

export default function RiskForecastPanel({ absentCount, delayedTasks, stoppageCount, criticalStations = 0, openHazards = 0, recentIncidents = 0, lang }) {
  const ar = lang === "ar";
  const risks = [
    { icon: UserRoundX, count: absentCount, label: ar ? "احتمال ضغط تشغيلي بسبب الغياب" : "Staffing pressure from absences", to: "/app/attendance", level: absentCount > 2 ? "high" : "medium" },
    { icon: Clock3, count: delayedTasks, label: ar ? "مهام معرضة لتجاوز الموعد" : "Tasks at risk of delay", to: "/app/tasks", level: delayedTasks > 2 ? "high" : "medium" },
    { icon: ShieldAlert, count: stoppageCount, label: ar ? "بلاغات توقف تتطلب الاحتواء" : "Stoppages requiring containment", to: "/app/performance", level: stoppageCount ? "high" : "low" },
    { icon: Flame, count: criticalStations, label: ar ? "محطات بحالة سلامة حرجة" : "Stations in critical safety state", to: "/app/safety", level: "high" },
    { icon: AlertTriangle, count: recentIncidents, label: ar ? "حوادث سلامة خلال 30 يوماً" : "Safety incidents in the last 30 days", to: "/app/safety", level: "high" },
    { icon: HardHat, count: openHazards, label: ar ? "مخاطر سلامة مفتوحة تحتاج معالجة" : "Open safety hazards to resolve", to: "/app/safety", level: "medium" },
  ].filter((item) => item.count > 0);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-accent">Predictive Intelligence</p><h2 className="mt-1 font-heading text-2xl font-semibold">{ar ? "رادار المخاطر" : "Risk Radar"}</h2></div><AlertTriangle className="h-5 w-5 text-accent" /></div>
      {risks.length === 0 ? <p className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700">{ar ? "لا توجد مخاطر تشغيلية مرتفعة الآن." : "No elevated operational risks detected."}</p> : <div className="space-y-2">
        {risks.map(({ icon: Icon, count, label, to, level }) => <Link key={label} to={to} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${level === "high" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{count} {ar ? "حالة مرصودة" : "signals detected"}</p></div></Link>)}
      </div>}
    </section>
  );
}