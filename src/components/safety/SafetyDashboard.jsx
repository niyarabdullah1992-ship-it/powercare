import React, { useMemo, useState } from "react";
import { buildSafetyDashboardData } from "@/lib/safetyDashboardData";
import SafetyDashboardCharts from "@/components/safety/SafetyDashboardCharts";

export default function SafetyDashboard({ safety, stations, lang }) {
  const [open, setOpen] = useState(true);
  const ar = lang === "ar";
  const dashboard = useMemo(() => buildSafetyDashboardData(safety, stations, lang), [safety, stations, lang]);
  const cards = [
    [ar ? "حوادث هذا الشهر" : "Incidents this month", dashboard.stats.currentMonth],
    [ar ? "محطات حرجة" : "Critical stations", dashboard.stats.critical],
    [ar ? "مخاطر مفتوحة" : "Open hazards", dashboard.stats.openHazards],
    [ar ? "محطات معتمدة" : "Approved stations", dashboard.stats.approved],
  ];
  const kpiTone = (value, target) => value <= target ? "text-emerald-600" : value <= target * 1.5 ? "text-amber-600" : "text-red-600";
  const kpiCards = [
    [ar ? "TRIR الموحّد" : "Company TRIR", dashboard.companyKpis.trir.toFixed(2), kpiTone(dashboard.companyKpis.trir, 3)],
    [ar ? "LTIFR الموحّد" : "Company LTIFR", dashboard.companyKpis.ltifr.toFixed(2), kpiTone(dashboard.companyKpis.ltifr, 1)],
    [ar ? "إجمالي ساعات العمل" : "Total work hours", dashboard.companyKpis.totalHours.toLocaleString(), dashboard.companyKpis.totalHours > 0 ? "text-emerald-600" : "text-red-600"],
    [ar ? "إجمالي LTI" : "Total LTI", dashboard.companyKpis.totalLti, dashboard.companyKpis.totalLti === 0 ? "text-emerald-600" : dashboard.companyKpis.totalLti === 1 ? "text-amber-600" : "text-red-600"],
    [ar ? "امتثال قوائم التحقق" : "Checklist compliance", `${dashboard.companyKpis.compliance}%`, dashboard.companyKpis.compliance >= 70 ? "text-emerald-600" : dashboard.companyKpis.compliance >= 50 ? "text-amber-600" : "text-red-600"],
  ];

  return (
    <section className="rounded-[28px] border border-border bg-card px-4 py-10 text-foreground shadow-soft sm:px-8 sm:py-12">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="mx-auto block w-full max-w-4xl text-center">
        <span className="block font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{ar ? "لوحة تحكم السلامة" : "Safety Dashboard"}</span>
        <span className="mt-3 block text-base text-muted-foreground sm:text-xl">{ar ? "نظرة موحدة على الحوادث والمخاطر لجميع المحطات" : "A unified view of incidents and risks across all stations"}</span>
      </button>
      {open && <div className="mx-auto mt-10 max-w-6xl space-y-4 rounded-[26px] border border-accent/25 bg-secondary/70 p-4 shadow-elevated sm:p-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{kpiCards.map(([label, value, tone]) => <div key={label} className="min-h-28 rounded-xl border border-border bg-card p-4 text-end shadow-soft"><p className="text-sm font-semibold text-foreground">{label}</p><p className={`mt-1 font-heading text-3xl font-semibold ${tone}`}>{value}</p></div>)}</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="min-h-24 rounded-xl border border-border bg-card p-4 text-end shadow-soft"><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-2 font-heading text-3xl font-semibold text-accent">{value}</p></div>)}</div>
        <SafetyDashboardCharts months={dashboard.months} hazards={dashboard.hazards} lang={lang} />
      </div>}
    </section>
  );
}