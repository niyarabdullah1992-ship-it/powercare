import React, { useMemo, useState } from "react";
import { CalendarDays, FileText } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import ExpenseExportButtons from "@/components/expenses/ExpenseExportButtons";
import ExpensePeriodControls from "@/components/expenses/ExpensePeriodControls";

const cutoffFor = (period, days) => {
  const date = new Date();
  if (period === "month") date.setMonth(date.getMonth() - 1);
  if (period === "3months") date.setMonth(date.getMonth() - 3);
  if (period === "6months") date.setMonth(date.getMonth() - 6);
  if (period === "year") date.setFullYear(date.getFullYear() - 1);
  if (period === "days") date.setDate(date.getDate() - Math.max(1, Number(days) || 1));
  return date;
};

export default function ExpenseReportPanel({ claims, stations, ar }) {
  const [stationId, setStationId] = useState("all"); const [period, setPeriod] = useState("month");
  const [days, setDays] = useState("30"); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => claims.filter((claim) => {
    const stationMatch = stationId === "all" || (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).includes(stationId);
    const claimDate = new Date(`${claim.expenseDate}T00:00:00`);
    const dateMatch = period === "between" ? (!from || claimDate >= new Date(`${from}T00:00:00`)) && (!to || claimDate <= new Date(`${to}T23:59:59`)) : claimDate >= cutoffFor(period, days);
    return stationMatch && dateMatch;
  }), [claims, stationId, period, days, from, to]);
  return <div className="space-y-3">
    <button type="button" onClick={() => setOpen((value) => !value)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body transition ${open ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}>
      <FileText className="h-3.5 w-3.5" /> {ar ? "تقرير المصروفات (PDF / Excel)" : "Expense report (PDF / Excel)"}
    </button>
    {open && <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{ar ? "تقرير المصروفات حسب الفترة" : "Expense report by period"}</p>
      <MobileSelect value={stationId} onChange={setStationId} placeholder={ar ? "المحطة" : "Station"} className="w-full sm:w-72" options={[{ value: "all", label: ar ? "كل المحطات" : "All stations" }, ...stations.map((station) => ({ value: station.stationId, label: station.name }))]} />
      <ExpensePeriodControls {...{ period, setPeriod, days, setDays, from, setFrom, to, setTo, ar }} />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1"><p className="text-xs text-muted-foreground">{ar ? `${filtered.length} مصروفًا ضمن التقرير` : `${filtered.length} expenses in report`}</p><ExpenseExportButtons claims={filtered} stations={stations} ar={ar} /></div>
    </section>}
  </div>;
}