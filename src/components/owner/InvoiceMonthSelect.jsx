import React, { useMemo } from "react";
import { CalendarDays } from "lucide-react";

const keyFor = (value) => /^\d{4}-\d{2}/.test(String(value || "")) ? String(value).slice(0, 7) : "";
export default function InvoiceMonthSelect({ invoices, value, onChange, ar }) {
  const months = useMemo(() => [...new Set(invoices.map((invoice) => keyFor(invoice.createdAt)).filter(Boolean))].sort().reverse(), [invoices]);
  const label = (key) => { const [year, month] = key.split("-"); return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(ar ? "ar-SA" : "en-GB", { month: "long", year: "numeric" }); };
  return <label className="relative min-w-44"><CalendarDays className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={value} onChange={(event) => onChange(event.target.value)} className="h-full w-full rounded-md border border-input py-2.5 pe-8 ps-9 text-sm"><option value="all">{ar ? "كل الأشهر" : "All months"}</option>{months.map((month) => <option key={month} value={month}>{label(month)}</option>)}</select></label>;
}