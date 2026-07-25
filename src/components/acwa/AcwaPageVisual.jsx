import React from "react";
import AcwaChartVisual from "@/components/acwa/AcwaChartVisual";
import AcwaComparisonVisual from "@/components/acwa/AcwaComparisonVisual";
import AcwaKpiVisual from "@/components/acwa/AcwaKpiVisual";
import AcwaStepsVisual from "@/components/acwa/AcwaStepsVisual";

const visuals = {
  chart: AcwaChartVisual,
  radar: AcwaChartVisual,
  pie: AcwaChartVisual,
  comparison: AcwaComparisonVisual,
  kpi: AcwaKpiVisual,
  steps: AcwaStepsVisual,
};

export default function AcwaPageVisual({ page }) {
  const Visual = visuals[page.visualType];
  if (!Visual) return null;
  return <div className="mx-12 mt-6 h-[220px] overflow-hidden rounded-xl border border-border bg-card p-4"><Visual type={page.visualType} data={page.visualData} /></div>;
}