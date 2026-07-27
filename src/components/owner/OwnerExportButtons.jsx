import React, { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportOwnerReportExcel, printOwnerReport } from "@/lib/ownerReportExport";

export default function OwnerExportButtons({ filename, title, headers, rows, ar }) {
  const [open, setOpen] = useState(false);
  const report = { filename, title, headers, rows, ar };
  return <div className="space-y-3">
    <button type="button" onClick={() => setOpen(!open)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body transition ${open ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}><FileText className="h-3.5 w-3.5" />{title} (PDF / Excel)</button>
    {open && <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
      <button disabled={!rows.length} onClick={() => exportOwnerReportExcel(report)} className="flex items-center gap-2 rounded-md border border-emerald-300 px-3.5 py-2 text-xs font-body text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"><FileSpreadsheet className="h-4 w-4" />Excel</button>
      <button disabled={!rows.length} onClick={() => printOwnerReport(report)} className="flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-xs font-body hover:bg-muted disabled:opacity-40"><FileText className="h-4 w-4" />PDF</button>
    </div>}
  </div>;
}