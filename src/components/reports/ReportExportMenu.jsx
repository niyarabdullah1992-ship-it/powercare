import React from "react";
import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ReportExportMenu({ label, onPdf, onExcel, disabled = false, lang = "en" }) {
  const ar = lang === "ar";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button disabled={disabled} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-accent/35 bg-card px-4 py-2 text-sm font-body text-foreground shadow-sm hover:border-accent/70 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40">
          <FileText className="h-5 w-5 shrink-0 text-accent" />
          <span className="truncate">{label} (PDF / Excel)</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-60 rounded-xl p-2 shadow-xl">
        {onPdf && <DropdownMenuItem onClick={onPdf} className="gap-3 rounded-lg px-3 py-3 text-base"><FileText className="h-5 w-5 text-accent" />{ar ? "تصدير PDF" : "Export PDF"}</DropdownMenuItem>}
        {onExcel && <DropdownMenuItem onClick={onExcel} className="gap-3 rounded-lg px-3 py-3 text-base"><FileSpreadsheet className="h-5 w-5 text-foreground" />{ar ? "تصدير Excel" : "Export Excel"}</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}