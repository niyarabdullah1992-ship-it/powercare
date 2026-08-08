import React from "react";

// KPI row in the NiroVera design language: white cards, navy figure, green sub-line.
function HrKpiRow({ items }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${items.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-body text-muted-foreground">{item.label}</p>
          <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-primary">{item.value}</p>
          <p className="mt-1.5 text-[11.5px] font-body text-accent">{item.note}</p>
        </div>
      ))}
    </div>
  );
}

export default React.memo(HrKpiRow);