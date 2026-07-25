import React, { useState } from "react";
import { CalendarDays, FileSpreadsheet, FileText, Printer } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { useAuth } from "@/lib/PowerCareAuth";
import { buildInventoryPeriodReport } from "@/lib/inventoryPeriodReport";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";

export default function InventoryPeriodReport({ reportData, ar }) {
  const { company, data } = useAuth();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("month");
  const [stationId, setStationId] = useState("all");
  const stations = reportData.stations || [];
  const stationOptions = [{ value: "all", label: ar ? "كل المحطات" : "All stations" }, ...stations.map((station) => ({ value: station.stationId || station.id, label: station.name }))];
  const periodOptions = [{ value: "month", label: ar ? "شهر" : "Month" }, { value: "3months", label: ar ? "٣ أشهر" : "3 months" }, { value: "6months", label: ar ? "٦ أشهر" : "6 months" }, { value: "year", label: ar ? "سنة" : "Year" }, { value: "2years", label: ar ? "سنتان" : "2 years" }];
  const report = buildInventoryPeriodReport({ ...reportData, stationId, period, ar });
  const title = ar ? "تقرير المخزون حسب الفترة" : "Inventory report by period";
  const branding = data?.reportBranding || {};
  const periodLabel = periodOptions.find((option) => option.value === period)?.label;
  const exportExcel = () => exportExcelColored({ filename: ar ? "تقرير_المخزون" : "inventory_report", title, headers: report.excelHeaders, rows: report.excelRows, color: branding.color || "#b07d3f", dir: ar ? "rtl" : "ltr" });
  const exportPdf = () => printReport({ title, companyName: company?.name || "", periodLabel, dir: ar ? "rtl" : "ltr", stats: report.stats, sections: report.sections, logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f" });
  return <div className="space-y-4">
    <button type="button" onClick={() => setOpen((value) => !value)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${open ? "border-accent bg-primary text-primary-foreground" : "border-accent/30 bg-card text-foreground hover:border-accent hover:bg-accent/5"}`}><FileText className="h-4 w-4 text-accent" />{ar ? "تقرير المخزون (PDF / Excel)" : "Inventory report (PDF / Excel)"}</button>
    {open && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="mb-5 flex items-center gap-2 font-heading text-lg font-semibold"><CalendarDays className="h-5 w-5 text-accent" />{title}</h2><div className="flex flex-wrap gap-3"><MobileSelect options={stationOptions} value={stationId} onChange={setStationId} placeholder={ar ? "المحطات" : "Stations"} searchable className="min-w-44" /><div className="flex flex-wrap gap-2">{periodOptions.map((option) => <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-full border px-4 py-2 text-sm ${period === option.value ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{option.label}</button>)}</div></div><p className="mt-4 text-xs text-muted-foreground">{ar ? "يعرض الأرصدة الحالية، والمشتريات والفواتير وحركات المخزون ضمن الفترة المختارة." : "Shows current balances plus purchases, invoices, and movements in the selected period."}</p><div className="mt-5 flex gap-3"><button onClick={exportExcel} className="flex items-center gap-2 rounded-xl border border-emerald-400 px-5 py-2.5 text-sm text-emerald-700"><FileSpreadsheet className="h-4 w-4" />Excel</button><button onClick={exportPdf} className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm"><Printer className="h-4 w-4" />PDF</button></div></section>}
  </div>;
}