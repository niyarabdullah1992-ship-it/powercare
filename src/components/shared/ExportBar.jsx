import React from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { usePeriod } from "@/lib/PeriodContext";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { canUsePlanFeature } from "@/lib/navVisibility";
import PlanFeatureNotice from "@/components/subscription/PlanFeatureNotice";

// The one export bar: Excel + PDF, same look and place everywhere, and it
// always carries the currently selected period into the exported file.
export default function ExportBar({ title, headers, rows, pdfHeaders = headers, pdfRows = rows, stats = [], theme = "default" }) {
  const { t, dir, lang } = useI18n();
  const { data, company } = useAuth();
  const { resolved } = usePeriod();
  // An invalid custom range must never be exported — the file would carry a
  // range the user did not ask for.
  const hasRows = Array.isArray(rows) && rows.length > 0 && resolved.valid;
  const branding = data?.reportBranding || {};
  const color = branding.color || "#b07d3f";
  if (!canUsePlanFeature(company, "exports")) return <PlanFeatureNotice />;

  const periodSuffix = resolved.label;
  const onExcel = () =>
    exportExcelColored({
      filename: `${title}_${resolved.startDay}_${resolved.endDay}`.replace(/\s+/g, "_"),
      title: `${title} — ${periodSuffix}`,
      headers,
      rows,
      color,
      dir,
    });

  const onPdf = () =>
    printReport({
      title,
      companyName: company?.name || "",
      periodLabel: periodSuffix,
      dir,
      stats,
      sections: [{ heading: title, headers: pdfHeaders, rows: pdfRows }],
      logoUrl: branding.logoUrl || "",
      color,
      theme,
    });

  const btn = "flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={!hasRows}
        onClick={onExcel}
        title={hasRows
          ? (lang === "ar" ? "Excel — الجدول المعروض حالياً بنطاقه وفلاتره" : "Excel — the table currently shown, with its range and filters")
          : !resolved.valid
            ? (lang === "ar" ? "النطاق المختار غير صالح — صحّح التاريخين أولاً" : "The selected range is invalid — fix the dates first")
            : (lang === "ar" ? "لا توجد بيانات للتصدير في هذه الفترة" : "No data to export in this period")}
        className={btn}
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> {t("exportExcel")}
      </button>
      <button
        disabled={!hasRows}
        onClick={onPdf}
        title={hasRows
          ? (lang === "ar" ? "PDF — الجدول المعروض حالياً بنطاقه وفلاتره" : "PDF — the table currently shown, with its range and filters")
          : !resolved.valid
            ? (lang === "ar" ? "النطاق المختار غير صالح — صحّح التاريخين أولاً" : "The selected range is invalid — fix the dates first")
            : (lang === "ar" ? "لا توجد بيانات للتصدير في هذه الفترة" : "No data to export in this period")}
        className={btn}
      >
        <Printer className="w-4 h-4" /> {dir === "rtl" ? "تصدير PDF" : "Export PDF"}
      </button>
    </div>
  );
}