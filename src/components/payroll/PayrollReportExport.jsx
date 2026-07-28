import React, { useState } from "react";
import { CalendarRange } from "lucide-react";
import ReportExportMenu from "@/components/reports/ReportExportMenu";
import MobileSelect from "@/components/mobile/MobileSelect";
import { netOf } from "@/lib/payroll";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { useAuth } from "@/lib/PowerCareAuth";
import { canUsePlanFeature } from "@/lib/navVisibility";
import PlanFeatureNotice from "@/components/subscription/PlanFeatureNotice";

const PRESETS = [{ id: "month", months: 1 }, { id: "3months", months: 3 }, { id: "6months", months: 6 }, { id: "year", months: 12 }, { id: "range", months: 0 }];
const shiftMonth = (key, amount) => { const date = new Date(`${key}-01T00:00:00`); date.setMonth(date.getMonth() + amount); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; };

export default function PayrollReportExport({ runs, employees, excludedEmployeeIds, stations, companyName, branding, lang, dir }) {
  const ar = lang === "ar"; const L = (a, e) => ar ? a : e;
  const [preset, setPreset] = useState("month"); const [stationId, setStationId] = useState("all");
  const [from, setFrom] = useState(shiftMonth(new Date().toISOString().slice(0, 7), -2)); const [to, setTo] = useState(new Date().toISOString().slice(0, 7));
  const { company } = useAuth();
  if (!canUsePlanFeature(company, "exports")) return <PlanFeatureNotice />;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const labels = { month: L("شهر", "1 Month"), "3months": L("٣ أشهر", "3 Months"), "6months": L("٦ أشهر", "6 Months"), year: L("سنة", "1 Year"), range: L("بين شهرين", "Month Range") };
  const employeeFor = (item) => employees.find((employee) => employee.id === item.employeeId);
  const itemStationId = (item) => employeeFor(item)?.stationId || item.employeeStationId || stations[0]?.id;
  const stationName = (id) => stations.find((station) => station.id === id)?.name || "—";
  const employeeName = (item) => employeeFor(item)?.name || item.employeeName || "—";
  const report = () => {
    const months = PRESETS.find((item) => item.id === preset)?.months || 0;
    const start = preset === "range" ? from : shiftMonth(currentMonth, -(months - 1)); const end = preset === "range" ? to : currentMonth;
    if (!start || !end || start > end) { alert(L("اختر نطاق أشهر صحيحًا", "Choose a valid month range")); return null; }
    const allowedStationIds = new Set(stations.map((station) => station.id));
    const entries = runs.filter((run) => run.month >= start && run.month <= end)
      .flatMap((run) => (run.items || []).map((item) => ({ ...item, month: run.month })))
      .filter((item) => !excludedEmployeeIds?.has(item.employeeId))
      .filter((item) => allowedStationIds.has(itemStationId(item)))
      .filter((item) => stationId === "all" || itemStationId(item) === stationId)
      .sort((a, b) => stationName(itemStationId(a)).localeCompare(stationName(itemStationId(b)), lang)
        || employeeName(a).localeCompare(employeeName(b), lang)
        || a.month.localeCompare(b.month));
    return { entries, period: `${start} → ${end}` };
  };
  const headers = [L("الشهر", "Month"), L("الموظف", "Employee"), L("المحطة", "Station"), L("الأساسي", "Base"), L("البدلات", "Allowances"), L("مكافآت", "Bonus"), L("خصومات", "Deductions"), L("الصافي", "Net"), L("الحالة", "Status")];
  const row = (item) => [item.month, employeeName(item), stationName(itemStationId(item)), item.base, item.allowances, item.bonus, item.deductions, netOf(item), item.paid ? L("مدفوع", "Paid") : L("غير مدفوع", "Unpaid")];
  const exportReport = (format) => { const result = report(); if (!result) return; const title = `${L("تقرير الرواتب", "Payroll Report")} — ${result.period}`; if (format === "excel") exportExcelColored({ filename: `payroll_report_${result.period.replaceAll(" ", "")}`, title, headers, rows: result.entries.map(row), color: branding.color || "#b07d3f", dir, theme: "executiveGold" }); else printReport({ title: L("تقرير الرواتب", "Payroll Report"), companyName, periodLabel: result.period, dir, logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f", stats: [{ value: result.entries.length, label: L("السجلات", "Records") }, { value: result.entries.filter((item) => item.paid).length, label: L("مدفوع", "Paid") }, { value: result.entries.reduce((sum, item) => sum + netOf(item), 0).toLocaleString(), label: L("إجمالي الصافي", "Total net") }], sections: [{ heading: L("تفاصيل الرواتب", "Payroll details"), headers, rows: result.entries.map(row) }] }); };
  return <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
    <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarRange className="h-4 w-4" />{L("تقرير الرواتب حسب الفترة", "Payroll report by period")}</p>
    <MobileSelect value={stationId} onChange={setStationId} searchable placeholder={L("كل المحطات", "All stations")} options={[{ value: "all", label: L("كل المحطات", "All stations") }, ...stations.map((station) => ({ value: station.id, label: station.name }))]} />
    <div className="flex flex-wrap gap-2">{PRESETS.map((item) => <button key={item.id} type="button" onClick={() => setPreset(item.id)} className={`rounded-full border px-3 py-1.5 text-xs ${preset === item.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{labels[item.id]}</button>)}</div>
    {preset === "range" && <div className="grid gap-3 sm:grid-cols-2"><input type="month" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-md border border-input px-3 py-2 text-sm" /><input type="month" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-md border border-input px-3 py-2 text-sm" /></div>}
    <ReportExportMenu label={L("تقرير الرواتب", "Payroll report")} onPdf={() => exportReport("pdf")} onExcel={() => exportReport("excel")} lang={lang} />
  </div>;
}