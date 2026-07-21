import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { buildStationInventoryReport } from "@/lib/stationInventoryReport";

export default function StationInventoryReportExport({ reportData, ar }) {
  const { data, company } = useAuth();
  const stations = reportData.stations || [];
  const [stationId, setStationId] = useState(stations[0]?.stationId || stations[0]?.id || "");
  const options = stations.map((station) => ({ value: station.stationId || station.id, label: station.name }));
  useEffect(() => {
    if (!stationId && stations.length) setStationId(stations[0].stationId || stations[0].id);
  }, [stations.length, stationId]);
  const branding = data?.reportBranding || {};
  const color = branding.color || "#b07d3f";
  const report = () => buildStationInventoryReport({ stationId, stations, items: reportData.items, historyItems: reportData.historyItems, movements: reportData.movements, requests: reportData.requests, employees: reportData.employees, ar });
  const exportExcel = () => {
    const output = report();
    exportExcelColored({ filename: output.title.replace(/\s+/g, "_"), title: output.title, headers: output.excelHeaders, rows: output.excelRows, color, dir: ar ? "rtl" : "ltr" });
  };
  const exportPdf = () => {
    const output = report();
    printReport({ title: output.title, companyName: company?.name || "", periodLabel: new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB"), dir: ar ? "rtl" : "ltr", stats: output.stats, sections: output.sections, logoUrl: branding.logoUrl || "", color });
  };
  return <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
    <MobileSelect options={options} value={stationId} onChange={setStationId} placeholder={ar ? "اختر المحطة" : "Select station"} searchable className="min-w-44" />
    <button disabled={!stationId} onClick={exportExcel} className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted disabled:opacity-40"><FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />{ar ? "Excel شامل" : "Full Excel"}</button>
    <button disabled={!stationId} onClick={exportPdf} className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted disabled:opacity-40"><Printer className="h-3.5 w-3.5" />{ar ? "PDF شامل" : "Full PDF"}</button>
  </div>;
}