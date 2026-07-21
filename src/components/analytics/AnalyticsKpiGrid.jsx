import React from "react";

export default function AnalyticsKpiGrid({ metrics, labels }) {
  const cards = [
    [metrics[0], labels.total],
    [metrics[1], labels.stable],
    [metrics[2], labels.attention],
  ];
  return (
    <div dir="ltr" className="grid gap-7 md:grid-cols-3">
      {cards.map(([value, label], index) => (
        <div key={label} className="holo-kpi min-h-28 rounded-2xl px-6 py-5 text-end">
          <p className="text-base font-medium text-white">{label}</p>
          {index === 2 && value === 0
            ? <p className="mt-4 text-sm text-slate-500">{labels.empty}</p>
            : <p className="mt-2 font-body text-3xl font-light text-holo-green">{value}</p>}
        </div>
      ))}
    </div>
  );
}