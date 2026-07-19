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
  const kpiTone = (value, target) => value <= target ? "text-[#55784b]" : value <= target * 1.5 ? "text-[#9a6418]" : "text-[#a33b2d]";
  const kpiCards = [
    [ar ? "TRIR الموحّد" : "Company TRIR", dashboard.companyKpis.trir.toFixed(2), kpiTone(dashboard.companyKpis.trir, 3)],
    [ar ? "LTIFR الموحّد" : "Company LTIFR", dashboard.companyKpis.ltifr.toFixed(2), kpiTone(dashboard.companyKpis.ltifr, 1)],
    [ar ? "إجمالي ساعات العمل" : "Total work hours", dashboard.companyKpis.totalHours.toLocaleString(), dashboard.companyKpis.totalHours > 0 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"],
    [ar ? "إجمالي LTI" : "Total LTI", dashboard.companyKpis.totalLti, dashboard.companyKpis.totalLti === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : dashboard.companyKpis.totalLti === 1 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-red-300 bg-red-50 text-red-700"],
    [ar ? "امتثال قوائم التحقق" : "Checklist compliance", `${dashboard.companyKpis.compliance}%`, dashboard.companyKpis.compliance >= 70 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : dashboard.companyKpis.compliance >= 50 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-red-300 bg-red-50 text-red-700"],
  ];

  return (
    <section className="rounded-[28px] bg-[#fbf8f1] px-4 py-10 text-[#382417] sm:px-8 sm:py-12">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="mx-auto block w-full max-w-4xl text-center">
        <span className="block font-heading text-4xl font-bold tracking-tight text-[#6f350b] sm:text-5xl">{ar ? "لوحة تحكم السلامة" : "Safety Dashboard"}</span>
        <span className="mt-3 block text-base text-[#7b421d] sm:text-xl">{ar ? "نظرة موحدة على الحوادث والمخاطر لجميع المحطات" : "A unified view of incidents and risks across all stations"}</span>
      </button>
      {open && <div className="mx-auto mt-10 max-w-6xl space-y-4 rounded-[26px] bg-[#d9b468] bg-cover bg-center p-4 shadow-[0_24px_60px_rgba(86,49,15,0.18)] sm:p-8" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/56171104a_generated_image.png')" }}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{kpiCards.map(([label, value, tone]) => <div key={label} className="min-h-28 rounded-xl border border-white/80 bg-[#f8f3e8]/90 p-4 text-end shadow-[inset_0_1px_0_rgba(255,255,255,.8)]"><p className="text-sm font-semibold text-[#2f2118]">{label}</p><p className={`mt-1 font-heading text-3xl font-semibold ${tone}`}>{value}</p></div>)}</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="min-h-24 rounded-xl border border-white/80 bg-[#f8f3e8]/90 p-4 text-end shadow-[inset_0_1px_0_rgba(255,255,255,.8)]"><p className="text-sm font-semibold text-[#2f2118]">{label}</p><p className="mt-2 font-heading text-3xl font-semibold text-[#71380f]">{value}</p></div>)}</div>
        <SafetyDashboardCharts months={dashboard.months} hazards={dashboard.hazards} lang={lang} />
      </div>}
    </section>
  );
}