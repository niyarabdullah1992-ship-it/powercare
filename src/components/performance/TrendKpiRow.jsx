import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { toArabicDigits } from "@/lib/trendFormat";

function Delta({ value, ar }) {
  if (value == null) {
    return <span className="flex items-center gap-1 text-xs text-muted-foreground font-body"><Minus className="h-3 w-3" />{ar ? "لا مقارنة" : "no baseline"}</span>;
  }
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const num = ar ? `${toArabicDigits(Math.abs(value))}٪` : `${Math.abs(value)}%`;
  return (
    <span className={`flex items-center gap-1 text-xs font-body ${up ? "text-emerald-700" : "text-destructive"}`}>
      <Icon className="h-3 w-3" />{num} {ar ? "عن الفترة السابقة" : "vs previous period"}
    </span>
  );
}

// A trend KPI is a value plus its comparison — never a bare number.
export default function TrendKpiRow({ items, ar }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body">{item.label}</p>
          <p className="mt-1 truncate font-heading text-2xl font-semibold">{item.value}</p>
          <div className="mt-1">
            {item.hint ? <span className="text-xs text-muted-foreground font-body">{item.hint}</span> : <Delta value={item.delta} ar={ar} />}
          </div>
        </div>
      ))}
    </div>
  );
}