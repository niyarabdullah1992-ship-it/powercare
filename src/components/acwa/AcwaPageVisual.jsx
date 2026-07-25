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
  return <div className="mx-12 mt-6 overflow-hidden rounded-xl border border-border bg-card p-3"><div className="h-[186px]"><Visual type={page.visualType} data={page.visualData} /></div><p className="mt-1 text-center font-mono text-[7px] tracking-wide text-muted-foreground">ILLUSTRATIVE MODEL • FINAL BASELINES AND TARGETS TO BE VALIDATED WITH ACWA</p></div>;
}