import React from "react";
import { getSectionAnalytics } from "@/lib/sectionAnalytics";
import AnalyticsKpiGrid from "@/components/analytics/AnalyticsKpiGrid";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";

export default function SectionAnalyticsPanel({ path, data, externalData, lang }) {
  const model = getSectionAnalytics(path, data, externalData, lang);
  if (!model) return null;
  return (
    <section className="luxury-analytics mb-6 overflow-hidden px-5 py-8 sm:px-10 sm:py-9">
      <div className="mb-7 text-left">
        <h2 className="font-body text-3xl font-light text-white">{model.labels.heading}</h2>
        <p className="mt-1 text-sm text-slate-500">{model.title}</p>
      </div>
      <AnalyticsKpiGrid metrics={model.metrics} labels={model.labels} />
      <div className="mt-8"><AnalyticsCharts categories={model.categories} months={model.months} labels={model.labels} /></div>
    </section>
  );
}