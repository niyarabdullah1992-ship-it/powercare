import React from "react";
import HolographicChartFrame from "@/components/dashboard/HolographicChartFrame";
import SmartSeriesLine from "@/components/dashboard/SmartSeriesLine";

export default function SmartOperationsChart({ data, labels }) {
  const series = [
    { key: "expenses", label: labels.expenses, color: "hsl(var(--landing-gold-light))" },
    { key: "complaints", label: labels.complaints, color: "hsl(var(--landing-gold))" },
    { key: "inventory", label: labels.inventory, color: "hsl(var(--accent))" },
  ];
  return (
    <HolographicChartFrame className="rounded-2xl">
      <div className="holo-chart grid gap-3 rounded-2xl p-4">
        {series.map((item) => <SmartSeriesLine key={item.key} data={data} dataKey={item.key} label={item.label} color={item.color} />)}
      </div>
    </HolographicChartFrame>
  );
}