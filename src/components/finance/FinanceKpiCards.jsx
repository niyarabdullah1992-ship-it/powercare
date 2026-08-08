import React from "react";

const fmt = (value, lang) => new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 0 }).format(value || 0);

// بطاقات المؤشرات المالية الرئيسية للفترة المختارة.
export default function FinanceKpiCards({ items, lang }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <div key={i} className="ops-kpi-card rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-2 font-heading text-2xl font-bold text-primary">{fmt(item.value, lang)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{item.note}</p>
        </div>
      ))}
    </div>
  );
}