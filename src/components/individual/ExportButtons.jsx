import React from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportExcel, exportPDF } from "@/lib/individualExport";

export default function ExportButtons({ title, filename, headers, rows, ar }) {
  const disabled = rows.length === 0;
  const btn = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-body hover:bg-muted transition disabled:opacity-40";
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => exportPDF(title, headers, rows, ar)} disabled={disabled} className={btn}>
        <FileDown className="w-3.5 h-3.5 text-accent" /> PDF
      </button>
      <button onClick={() => exportExcel(filename, headers, rows)} disabled={disabled} className={btn}>
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
      </button>
    </div>
  );
}