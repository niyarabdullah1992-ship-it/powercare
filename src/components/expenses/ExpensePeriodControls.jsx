import React from "react";

const PERIODS = [
  ["month", "شهر", "Month"], ["3months", "٣ أشهر", "3 months"],
  ["6months", "٦ أشهر", "6 months"], ["year", "سنة", "Year"],
  ["days", "تحديد أيام", "Choose days"], ["between", "بين تاريخين", "Between dates"],
];

export default function ExpensePeriodControls({ period, setPeriod, days, setDays, from, setFrom, to, setTo, ar }) {
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      {PERIODS.map(([value, arLabel, enLabel]) => <button key={value} type="button" onClick={() => setPeriod(value)} className={`rounded-full border px-4 py-2 text-sm ${period === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>{ar ? arLabel : enLabel}</button>)}
    </div>
    {period === "days" && <label className="flex max-w-xs items-center gap-2 text-sm"><span className="shrink-0 text-muted-foreground">{ar ? "عدد الأيام" : "Number of days"}</span><input type="number" min="1" value={days} onChange={(event) => setDays(event.target.value)} className="w-full rounded-lg border border-input px-3 py-2" /></label>}
    {period === "between" && <div className="grid max-w-xl gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">{ar ? "من تاريخ" : "From"}<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-foreground" /></label><label className="text-xs text-muted-foreground">{ar ? "إلى تاريخ" : "To"}<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-foreground" /></label></div>}
  </div>;
}