import React, { useState } from "react";
import { CalendarDays } from "lucide-react";
import ReportPanelToggle from "@/components/reports/ReportPanelToggle";
import ReportExportMenu from "@/components/reports/ReportExportMenu";
import MobileSelect from "@/components/mobile/MobileSelect";
import { useAuth } from "@/lib/PowerCareAuth";
import { buildInventoryPeriodReport } from "@/lib/inventoryPeriodReport";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import InventoryReportThemeSelect from "@/components/inventory/InventoryReportThemeSelect";

export default function InventoryPeriodReport({ reportData, ar }) {
  const { company, data } = useAuth();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("month");
  const [stationId, setStationId] = useState("all");
  const [pdfTheme, setPdfTheme] = useState("inventorySimplified");
  const stations = reportData.stations || [];
  const stationOptions = [{ value: "all", label: ar ? "كل المحطات" : "All stations" }, ...stations.map((station) => ({ value: station.stationId || station.id, label: station.name }))];
  const periodOptions = [{ value: "month", label: ar ? "شهر" : "Month" }, { value: "3months", label: ar ? "٣ أشهر" : "3 months" }, { value: "6months", label: ar ? "٦ أشهر" : "6 months" }, { value: "year", label: ar ? "سنة" : "Year" }, { value: "2years", label: ar ? "سنتان" : "2 years" }];
  const report = buildInventoryPeriodReport({ ...reportData, stationId, period, ar });
  const title = ar ? "تقرير المخزون حسب الفترة" : "Inventory report by period";
  const branding = data?.reportBranding || {};
  const periodLabel = periodOptions.find((option) => option.value === period)?.label;
  const exportExcel = () => exportExcelColored({ filename: ar ? "تقرير_المخزون" : "inventory_report", title, headers: report.excelHeaders, rows: report.excelRows, color: branding.color || "#b07d3f", dir: ar ? "rtl" : "ltr" });
  const exportPdf = () => printReport({ title, companyName: company?.name || "", periodLabel, dir: ar ? "rtl" : "ltr", stats: report.stats, sections: report.sections, logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f", theme: pdfTheme });
  return <div className="space-y-4">
    <ReportPanelToggle open={open} onClick={() => setOpen((value) => !value)} label={ar ? "تقرير المخزون (PDF / Excel)" : "Inventory report (PDF / Excel)"} />
    {open && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="mb-5 flex items-center gap-2 font-heading text-lg font-semibold"><CalendarDays className="h-5 w-5 text-accent" />{title}</h2><div className="flex flex-wrap gap-3"><MobileSelect options={stationOptions} value={stationId} onChange={setStationId} placeholder={ar ? "المحطات" : "Stations"} searchable className="min-w-44" /><div className="flex flex-wrap gap-2">{periodOptions.map((option) => <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-full border px-4 py-2 text-sm ${period === option.value ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{option.label}</button>)}</div></div><p className="mt-4 text-xs text-muted-foreground">{ar ? "يعرض الأرصدة الحالية، والمشتريات والفواتير وحركات المخزون ضمن الفترة المختارة." : "Shows current balances plus purchases, invoices, and movements in the selected period."}</p><div className="mt-5 flex flex-wrap gap-3"><InventoryReportThemeSelect value={pdfTheme} onChange={setPdfTheme} ar={ar} /><ReportExportMenu label={ar ? "تقرير المخزون" : "Inventory report"} onPdf={exportPdf} onExcel={exportExcel} lang={ar ? "ar" : "en"} /></div></section>}
  </div>;
}