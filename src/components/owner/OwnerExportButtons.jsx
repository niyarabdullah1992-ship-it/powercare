import React from "react";
import ReportExportMenu from "@/components/reports/ReportExportMenu";
import { exportOwnerReportExcel, printOwnerReport } from "@/lib/ownerReportExport";

export default function OwnerExportButtons({ filename, title, headers, rows, ar }) {
  const report = { filename, title, headers, rows, ar };
  return <ReportExportMenu label={title} onPdf={() => printOwnerReport(report)} onExcel={() => exportOwnerReportExcel(report)} disabled={!rows.length} lang={ar ? "ar" : "en"} />;
}