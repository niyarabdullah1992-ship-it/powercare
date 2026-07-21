import React from "react";
import { Database, ShieldCheck, TriangleAlert, Layers3 } from "lucide-react";

export default function AnalyticsKpiGrid({ metrics, labels }) {
  const cards = [
    [Database, metrics[0], labels.total],
    [ShieldCheck, metrics[1], labels.stable],
    [TriangleAlert, metrics[2], labels.attention],
    [Layers3, metrics[3], labels.groups],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(([Icon, value, label]) => (
        <div key={label} className="analytics-kpi rounded-xl border border-white/10 bg-white/[0.06] p-4">
          <Icon className="mb-3 h-4 w-4 text-landing-gold-light" />
          <p className="font-heading text-3xl text-white">{value}</p>
          <p className="text-[11px] text-white/55">{label}</p>
        </div>
      ))}
    </div>
  );
}