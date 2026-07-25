import React from "react";
import { Layers3, Building2, Gauge, Users, ShieldCheck, Workflow, Timer, FileCheck, ChartNoAxesCombined, Smartphone, Database, Target } from "lucide-react";

const icons = { layers: Layers3, sites: Building2, gauge: Gauge, users: Users, shield: ShieldCheck, flow: Workflow, time: Timer, file: FileCheck, chart: ChartNoAxesCombined, mobile: Smartphone, data: Database, target: Target };

export default function AcwaKpiVisual({ data }) {
  const large = data.items.length <= 3;
  return <div className={`grid h-full gap-3 ${large ? "grid-cols-3" : "grid-cols-3 grid-rows-2"}`}>
    {data.items.map((item, index) => {
      const Icon = icons[item.icon] || Gauge;
      return <div key={index} className="flex flex-col items-center justify-center rounded-lg border border-border bg-secondary/60 p-3 text-center">
        <Icon className="mb-2 h-5 w-5 text-accent" />
        <strong className={`${large ? "text-3xl" : "text-2xl"} font-heading text-primary`}>{item.value}</strong>
        <span className="mt-1 text-[9px] font-semibold">{item.label}</span>
        <span dir="rtl" className="text-[8px] text-muted-foreground">{item.labelAr}</span>
      </div>;
    })}
  </div>;
}