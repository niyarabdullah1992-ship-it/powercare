import React from "react";
import { useI18n } from "@/lib/i18n";
import ReportExportMenu from "@/components/reports/ReportExportMenu";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { canUsePlanFeature } from "@/lib/navVisibility";
import PlanFeatureNotice from "@/components/subscription/PlanFeatureNotice";

// Colored Excel + branded PDF export for any comparison table.
export default function ComparisonExportButtons({ title, headers, rows, pdfHeaders = headers, pdfRows = rows, compact = false, stats = [], theme = "default" }) {
  const { dir, lang } = useI18n();
  const { data, company } = useAuth();
  const hasRows = Array.isArray(rows) && rows.length > 0;
  const branding = data?.reportBranding || {};
  const color = branding.color || "#b07d3f";
  if (!canUsePlanFeature(company, "exports")) return <PlanFeatureNotice />;

  const onExcel = () =>
    exportExcelColored({ filename: title.replace(/\s+/g, "_"), title, headers, rows, color, dir });

  const onPdf = () =>
    printReport({
      title,
      companyName: company?.name || "",
      periodLabel: new Date().toLocaleDateString(),
      dir,
      stats,
      sections: [{ heading: title, headers: pdfHeaders, rows: pdfRows }],
      logoUrl: branding.logoUrl || "",
      color,
      theme,
    });

  return <ReportExportMenu label={title} onPdf={onPdf} onExcel={onExcel} disabled={!hasRows} lang={lang} />;
}