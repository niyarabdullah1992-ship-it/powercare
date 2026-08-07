import React, { useMemo, useState } from "react";
import { CalendarDays, FileText } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import ExpenseExportButtons from "@/components/expenses/ExpenseExportButtons";
import PeriodPicker from "@/components/shared/PeriodPicker";
import { usePeriod } from "@/lib/PeriodContext";

// The period comes from the unified global period system (PeriodContext).
export default function ExpenseReportPanel({ claims, stations, ar }) {
  const [stationId, setStationId] = useState("all");
  const [open, setOpen] = useState(false);
  const { resolved } = usePeriod();
  const filtered = useMemo(() => claims.filter((claim) => {
    const stationMatch = stationId === "all" || (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).includes(stationId);
    const claimDate = new Date(`${claim.expenseDate}T00:00:00`);
    const dateMatch = resolved.valid && claimDate >= resolved.start && claimDate <= resolved.end;
    return stationMatch && dateMatch;
  }), [claims, stationId, resolved]);
  return <div className="space-y-3">
    <button type="button" onClick={() => setOpen((value) => !value)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body transition ${open ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}>
      <FileText className="h-3.5 w-3.5" /> {ar ? "تقرير المصروفات (PDF / Excel)" : "Expense report (PDF / Excel)"}
    </button>
    {open && <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{ar ? "تقرير المصروفات حسب الفترة" : "Expense report by period"}</p>
      <MobileSelect value={stationId} onChange={setStationId} placeholder={ar ? "المحطة" : "Station"} className="w-full sm:w-72" options={[{ value: "all", label: ar ? "كل المحطات" : "All stations" }, ...stations.map((station) => ({ value: station.stationId, label: station.name }))]} />
      <PeriodPicker showDaily showWeekly />
      {resolved.valid ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">{ar ? "معروض" : "Showing"}: {resolved.label} · {ar ? `${filtered.length} مصروفًا ضمن التقرير` : `${filtered.length} expenses in report`}</p>
          <ExpenseExportButtons claims={filtered} stations={stations} ar={ar} />
        </div>
      ) : (
        <p className="text-xs text-destructive font-body">{ar ? "لم يُطبَّق نطاق — أكمل اختيار التاريخين." : "No range applied — finish selecting both dates."}</p>
      )}
    </section>}
  </div>;
}