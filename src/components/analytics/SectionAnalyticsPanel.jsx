import React from "react";
import { BarChart3 } from "lucide-react";
import { getSectionAnalytics } from "@/lib/sectionAnalytics";
import AnalyticsKpiGrid from "@/components/analytics/AnalyticsKpiGrid";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";

export default function SectionAnalyticsPanel({ path, data, externalData, lang }) {
  const model = getSectionAnalytics(path, data, externalData, lang);
  if (!model) return null;
  const hasData = model.metrics[0] > 0;
  return (
    <section className="luxury-analytics mb-6 overflow-hidden rounded-2xl border border-landing-gold/30 bg-landing-olive p-4 shadow-elevated sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-landing-gold/40 bg-white/10"><BarChart3 className="h-5 w-5 text-landing-gold-light" /></span>
        <div><p className="text-[10px] uppercase tracking-widest text-landing-gold-light">{model.labels.heading}</p><h2 className="font-heading text-2xl text-white">{model.title}</h2></div>
      </div>
      <AnalyticsKpiGrid metrics={model.metrics} labels={model.labels} />
      {hasData ? <div className="mt-3"><AnalyticsCharts categories={model.categories} months={model.months} labels={model.labels} /></div> : <p className="py-8 text-center text-sm text-white/50">{model.labels.empty}</p>}
    </section>
  );
}