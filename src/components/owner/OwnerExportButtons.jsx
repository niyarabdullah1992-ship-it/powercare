import React from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportOwnerReportExcel, printOwnerReport } from "@/lib/ownerReportExport";

export default function OwnerExportButtons({ filename, title, headers, rows, ar }) {
  const report = { filename, title, headers, rows, ar };
  return <div className="flex flex-wrap justify-end gap-2">
    <button disabled={!rows.length} onClick={() => exportOwnerReportExcel(report)} className="flex items-center gap-2 rounded-md border border-emerald-300 bg-card px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-40"><FileSpreadsheet className="h-4 w-4" />Excel</button>
    <button disabled={!rows.length} onClick={() => printOwnerReport(report)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"><FileText className="h-4 w-4" />PDF</button>
  </div>;
}