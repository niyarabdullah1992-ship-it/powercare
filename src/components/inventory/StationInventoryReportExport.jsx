import React, { useEffect, useState } from "react";
import ReportExportMenu from "@/components/reports/ReportExportMenu";
import MobileSelect from "@/components/mobile/MobileSelect";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { buildStationInventoryReport } from "@/lib/stationInventoryReport";
import InventoryReportThemeSelect from "@/components/inventory/InventoryReportThemeSelect";

export default function StationInventoryReportExport({ reportData, ar }) {
  const { data, company } = useAuth();
  const stations = reportData.stations || [];
  const [stationId, setStationId] = useState(stations[0]?.stationId || stations[0]?.id || "");
  const [pdfTheme, setPdfTheme] = useState("inventorySimplified");
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
    printReport({ title: output.title, companyName: company?.name || "", periodLabel: new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB"), dir: ar ? "rtl" : "ltr", stats: output.stats, sections: output.sections, logoUrl: branding.logoUrl || "", color, theme: pdfTheme });
  };
  return <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
    <MobileSelect options={options} value={stationId} onChange={setStationId} placeholder={ar ? "اختر المحطة" : "Select station"} searchable className="min-w-44" />
    <InventoryReportThemeSelect value={pdfTheme} onChange={setPdfTheme} ar={ar} />
    <ReportExportMenu label={ar ? "تقرير مخزون المحطة" : "Station inventory report"} onPdf={exportPdf} onExcel={exportExcel} disabled={!stationId} lang={ar ? "ar" : "en"} />
  </div>;
}