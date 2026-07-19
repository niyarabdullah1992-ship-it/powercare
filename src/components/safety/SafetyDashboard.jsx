import React, { useMemo, useState } from "react";
import { Activity, AlertTriangle, BadgeCheck, CheckCircle2, ChevronDown, Clock3, ShieldAlert, Siren, TriangleAlert } from "lucide-react";
import { buildSafetyDashboardData } from "@/lib/safetyDashboardData";
import SafetyDashboardCharts from "@/components/safety/SafetyDashboardCharts";
import SafetyMetricCard from "@/components/safety/SafetyMetricCard";

export default function SafetyDashboard({ safety, stations, lang }) {
  const [open, setOpen] = useState(true);
  const ar = lang === "ar";
  const dashboard = useMemo(() => buildSafetyDashboardData(safety, stations, lang), [safety, stations, lang]);
  const kpiTone = (value, target) => value <= target ? "text-emerald-600" : value <= target * 1.5 ? "text-amber-600" : "text-red-600";
  const kpiCards = [
    { icon: Activity, label: ar ? "TRIR الموحّد" : "Company TRIR", value: dashboard.companyKpis.trir.toFixed(2), sub: ar ? "الهدف ≤ 3" : "Target ≤ 3", tone: kpiTone(dashboard.companyKpis.trir, 3), alert: dashboard.companyKpis.trir > 4.5 },
    { icon: ShieldAlert, label: ar ? "LTIFR الموحّد" : "Company LTIFR", value: dashboard.companyKpis.ltifr.toFixed(2), sub: ar ? "الهدف ≤ 1" : "Target ≤ 1", tone: kpiTone(dashboard.companyKpis.ltifr, 1), alert: dashboard.companyKpis.ltifr > 1.5 },
    { icon: Clock3, label: ar ? "ساعات العمل" : "Work Hours", value: dashboard.companyKpis.totalHours.toLocaleString(), sub: ar ? "الإجمالي المسجل" : "total recorded", tone: dashboard.companyKpis.totalHours > 0 ? "text-emerald-600" : "text-red-600" },
    { icon: TriangleAlert, label: ar ? "إجمالي LTI" : "Total LTI", value: dashboard.companyKpis.totalLti, sub: ar ? "إصابات الوقت الضائع" : "lost-time injuries", tone: dashboard.companyKpis.totalLti === 0 ? "text-emerald-600" : dashboard.companyKpis.totalLti === 1 ? "text-amber-600" : "text-red-600", alert: dashboard.companyKpis.totalLti > 1 },
    { icon: CheckCircle2, label: ar ? "امتثال التحقق" : "Compliance", value: `${dashboard.companyKpis.compliance}%`, sub: ar ? "قوائم التحقق" : "safety checklists", tone: dashboard.companyKpis.compliance >= 70 ? "text-emerald-600" : dashboard.companyKpis.compliance >= 50 ? "text-amber-600" : "text-red-600", alert: dashboard.companyKpis.compliance < 50 },
  ];
  const statusCards = [
    { icon: Siren, label: ar ? "حوادث هذا الشهر" : "Monthly Incidents", value: dashboard.stats.currentMonth, sub: ar ? "خلال الشهر الحالي" : "this month", alert: dashboard.stats.currentMonth > 0 },
    { icon: ShieldAlert, label: ar ? "محطات حرجة" : "Critical Stations", value: dashboard.stats.critical, sub: ar ? "تتطلب تدخلاً" : "require attention", alert: dashboard.stats.critical > 0 },
    { icon: AlertTriangle, label: ar ? "مخاطر مفتوحة" : "Open Hazards", value: dashboard.stats.openHazards, sub: ar ? "عبر جميع المحطات" : "across all stations", alert: dashboard.stats.openHazards > 0 },
    { icon: BadgeCheck, label: ar ? "محطات معتمدة" : "Approved Stations", value: dashboard.stats.approved, sub: ar ? "بيانات سلامة معتمدة" : "approved safety data" },
  ];

  return (
    <section className="space-y-4">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 text-start">
        <span>
          <span className="block font-heading text-xl font-semibold">{ar ? "لوحة مؤشرات السلامة" : "Safety Overview"}</span>
          <span className="mt-1 block text-sm font-body text-muted-foreground">{ar ? "نظرة شاملة على مؤشرات السلامة والمخاطر في جميع المحطات" : "A company-wide view of safety performance, incidents and hazards"}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kpiCards.map((card) => <SafetyMetricCard key={card.label} {...card} />)}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statusCards.map((card) => <SafetyMetricCard key={card.label} {...card} />)}
        </div>
        <SafetyDashboardCharts months={dashboard.months} hazards={dashboard.hazards} lang={lang} />
      </div>}
    </section>
  );
}