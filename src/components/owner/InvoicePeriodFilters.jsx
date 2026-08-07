import React from "react";
import { CalendarRange } from "lucide-react";

const optionsFor = (ar) => [
  ["all", ar ? "كل الأشهر" : "All months"],
  ["current", ar ? "الشهر الحالي" : "Current month"],
  ["3", ar ? "٣ أشهر" : "3 months"],
  ["6", ar ? "٦ أشهر" : "6 months"],
  ["12", ar ? "سنة" : "1 year"],
  ["range", ar ? "بين تاريخين" : "Date range"],
];

export default function InvoicePeriodFilters({ period, onPeriodChange, from, to, onFromChange, onToChange, ar }) {
  return (
    <section className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><CalendarRange className="h-3.5 w-3.5" />{ar ? "فواتير الاشتراكات حسب الفترة" : "Subscription invoices by period"}</p>
      <div className="flex flex-wrap gap-2">
        {optionsFor(ar).map(([value, label]) => <button key={value} type="button" onClick={() => onPeriodChange(value)} className={`rounded-full border px-3 py-1.5 text-xs font-body transition ${period === value ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{label}</button>)}
      </div>
      {period === "range" && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label><span className="mb-1 block text-xs text-muted-foreground">{ar ? "من تاريخ" : "From date"}</span><input type="date" value={from} max={to || undefined} onChange={(event) => onFromChange(event.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm" /></label>
        <label><span className="mb-1 block text-xs text-muted-foreground">{ar ? "إلى تاريخ" : "To date"}</span><input type="date" value={to} min={from || undefined} onChange={(event) => onToChange(event.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm" /></label>
      </div>}
    </section>
  );
}