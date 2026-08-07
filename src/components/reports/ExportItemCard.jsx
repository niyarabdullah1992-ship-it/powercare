import React from "react";
import { FileSpreadsheet, Printer } from "lucide-react";

// One report row in the Export Center: icon, title, record count, and branded
// Excel / PDF download buttons.
export default function ExportItemCard({ icon: Icon, title, count, color, ar, onExcel, onPdf }) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="font-body text-sm font-medium truncate">{title}</p>
          <p className="text-[11px] text-muted-foreground font-body">{count} {ar ? "سجل" : "records"}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={onExcel} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-[11px] font-body hover:bg-muted">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
        </button>
        <button onClick={onPdf} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-[11px] font-body hover:bg-muted">
          <Printer className="w-3.5 h-3.5" style={{ color }} /> PDF
        </button>
      </div>
    </div>
  );
}