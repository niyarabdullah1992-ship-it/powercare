import React, { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
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
  const filtered = useMemo(() => claims.filter((claim) => {
    const stationMatch = stationId === "all" || (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).includes(stationId);
    const claimDate = new Date(`${claim.expenseDate}T00:00:00`);
    const dateMatch = period === "between" ? (!from || claimDate >= new Date(`${from}T00:00:00`)) && (!to || claimDate <= new Date(`${to}T23:59:59`)) : claimDate >= cutoffFor(period, days);
    return stationMatch && dateMatch;
  }), [claims, stationId, period, days, from, to]);
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-accent" /><h2 className="font-heading text-lg font-semibold">{ar ? "تقرير المصروفات حسب الفترة" : "Expense report by period"}</h2></div>
    <MobileSelect value={stationId} onChange={setStationId} placeholder={ar ? "المحطة" : "Station"} className="mb-4 w-full rounded-xl py-3" options={[{ value: "all", label: ar ? "كل المحطات" : "All stations" }, ...stations.map((station) => ({ value: station.stationId, label: station.name }))]} />
    <ExpensePeriodControls {...{ period, setPeriod, days, setDays, from, setFrom, to, setTo, ar }} />
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs text-muted-foreground">{ar ? `${filtered.length} مصروفًا ضمن التقرير` : `${filtered.length} expenses in report`}</p><ExpenseExportButtons claims={filtered} stations={stations} ar={ar} /></div>
  </section>;
}