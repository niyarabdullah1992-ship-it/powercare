import React from "react";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";

// Colored Excel + branded PDF export for any comparison table.
export default function ComparisonExportButtons({ title, headers, rows, pdfHeaders = headers, pdfRows = rows, compact = false }) {
  const { t, dir } = useI18n();
  const pdfLabel = dir === "rtl" ? "تصدير PDF" : "Export PDF";
  const { data, company } = useAuth();
  const hasRows = Array.isArray(rows) && rows.length > 0;
  const branding = data?.reportBranding || {};
  const color = branding.color || "#b07d3f";

  const onExcel = () =>
    exportExcelColored({ filename: title.replace(/\s+/g, "_"), title, headers, rows, color, dir });

  const onPdf = () =>
    printReport({
      title,
      companyName: company?.name || "",
      periodLabel: new Date().toLocaleDateString(),
      dir,
      stats: [],
      sections: [{ heading: title, headers: pdfHeaders, rows: pdfRows }],
      logoUrl: branding.logoUrl || "",
      color,
    });

  return (
    <div className="flex items-center gap-2">
      <button disabled={!hasRows} onClick={onExcel} className={compact ? "flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-emerald-300 text-emerald-700 text-xs font-body hover:bg-emerald-50 transition disabled:opacity-40 disabled:cursor-not-allowed" : "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"}>
        <FileSpreadsheet className={compact ? "w-4 h-4" : "w-3.5 h-3.5 text-emerald-600"} /> {compact ? "Excel" : t("exportExcel")}
      </button>
      <button disabled={!hasRows} onClick={onPdf} className={compact ? "flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border text-xs font-body hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed" : "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"}>
        {compact ? <FileText className="w-4 h-4" /> : <Printer className="w-3.5 h-3.5" />} {compact ? "PDF" : pdfLabel}
      </button>
    </div>
  );
}