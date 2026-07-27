import React from "react";
import { CalendarRange, RotateCcw } from "lucide-react";

export default function InvoicePeriodFilters({ period, onPeriodChange, from, to, onFromChange, onToChange, ar }) {
  const reset = () => { onPeriodChange("all"); onFromChange(""); onToChange(""); };
  return <section className="rounded-xl border border-accent/30 bg-card p-4 shadow-soft">
    <div className="mb-3 flex items-center gap-2 text-primary"><CalendarRange className="h-4 w-4 text-accent" /><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{ar ? "الفترة المالية" : "Financial period"}</p><p className="text-xs text-muted-foreground">{ar ? "اختر عدة أشهر أو نطاقًا بين تاريخين" : "Choose multiple months or a custom date range"}</p></div></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <label className="space-y-1"><span className="text-[11px] text-muted-foreground">{ar ? "الأشهر" : "Months"}</span><select value={period} onChange={(event) => onPeriodChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="all">{ar ? "كل الأشهر" : "All months"}</option><option value="current">{ar ? "الشهر الحالي" : "Current month"}</option><option value="3">{ar ? "آخر 3 أشهر" : "Last 3 months"}</option><option value="6">{ar ? "آخر 6 أشهر" : "Last 6 months"}</option><option value="12">{ar ? "آخر 12 شهرًا" : "Last 12 months"}</option></select></label>
      <label className="space-y-1"><span className="text-[11px] text-muted-foreground">{ar ? "من تاريخ" : "From date"}</span><input type="date" value={from} max={to || undefined} onChange={(event) => onFromChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" /></label>
      <label className="space-y-1"><span className="text-[11px] text-muted-foreground">{ar ? "إلى تاريخ" : "To date"}</span><input type="date" value={to} min={from || undefined} onChange={(event) => onToChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" /></label>
      <button type="button" onClick={reset} className="mt-auto flex h-10 items-center justify-center gap-2 rounded-md border border-accent/40 px-3 text-xs font-semibold text-primary hover:bg-secondary"><RotateCcw className="h-4 w-4 text-accent" />{ar ? "إعادة" : "Reset"}</button>
    </div>
  </section>;
}