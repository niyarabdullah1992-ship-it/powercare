import React from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";

// Colored Excel + branded PDF export for any comparison table.
export default function ComparisonExportButtons({ title, headers, rows, pdfHeaders = headers, pdfRows = rows }) {
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
      <button disabled={!hasRows} onClick={onExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> {t("exportExcel")}
      </button>
      <button disabled={!hasRows} onClick={onPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
        <Printer className="w-3.5 h-3.5" /> {pdfLabel}
      </button>
    </div>
  );
}