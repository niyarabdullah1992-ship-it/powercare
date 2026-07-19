import React, { useMemo, useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
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
  const kpiTone = (value, target) => value <= target ? "border-emerald-300 bg-emerald-50 text-emerald-700" : value <= target * 1.5 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-red-300 bg-red-50 text-red-700";
  const kpiCards = [
    [ar ? "TRIR الموحّد" : "Company TRIR", dashboard.companyKpis.trir.toFixed(2), kpiTone(dashboard.companyKpis.trir, 3)],
    [ar ? "LTIFR الموحّد" : "Company LTIFR", dashboard.companyKpis.ltifr.toFixed(2), kpiTone(dashboard.companyKpis.ltifr, 1)],
    [ar ? "إجمالي ساعات العمل" : "Total work hours", dashboard.companyKpis.totalHours.toLocaleString(), dashboard.companyKpis.totalHours > 0 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"],
    [ar ? "إجمالي LTI" : "Total LTI", dashboard.companyKpis.totalLti, dashboard.companyKpis.totalLti === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : dashboard.companyKpis.totalLti === 1 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-red-300 bg-red-50 text-red-700"],
    [ar ? "امتثال قوائم التحقق" : "Checklist compliance", `${dashboard.companyKpis.compliance}%`, dashboard.companyKpis.compliance >= 70 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : dashboard.companyKpis.compliance >= 50 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-red-300 bg-red-50 text-red-700"],
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-accent/25 bg-card shadow-sm">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center gap-3 px-5 py-4 text-start hover:bg-muted/50">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><BarChart3 className="h-5 w-5" /></span>
        <span className="flex-1"><span className="block font-heading text-xl font-semibold">{ar ? "لوحة تحكم السلامة" : "Safety Dashboard"}</span><span className="text-xs text-muted-foreground">{ar ? "نظرة موحدة على الحوادث والمخاطر لجميع المحطات" : "A unified view of incidents and risks across all stations"}</span></span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-4 border-t border-accent/15 p-4 sm:p-5"><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{kpiCards.map(([label, value, tone]) => <div key={label} className={`rounded-xl border p-4 ${tone}`}><p className="text-2xl font-heading font-semibold">{value}</p><p className="mt-1 text-xs opacity-80">{label}</p></div>)}</div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-muted/35 p-4"><p className="text-2xl font-heading font-semibold text-accent">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div><SafetyDashboardCharts months={dashboard.months} hazards={dashboard.hazards} lang={lang} /></div>}
    </section>
  );
}