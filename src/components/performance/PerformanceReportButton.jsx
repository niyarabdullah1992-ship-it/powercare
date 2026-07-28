import React from "react";
import ReportExportMenu from "@/components/reports/ReportExportMenu";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { canUsePlanFeature } from "@/lib/navVisibility";
import PlanFeatureNotice from "@/components/subscription/PlanFeatureNotice";

export default function PerformanceReportButton({ title, headers, rows, stats = [] }) {
  const { dir, lang } = useI18n();
  const { data, company } = useAuth();
  const branding = data?.reportBranding || {};
  const disabled = !Array.isArray(rows) || rows.length === 0;
  if (!canUsePlanFeature(company, "exports")) return <PlanFeatureNotice />;
  const excel = () => exportExcelColored({ filename: title.replace(/\s+/g, "_"), title, headers, rows, color: branding.color || "#b07d3f", dir });
  const pdf = () => printReport({ title, companyName: company?.name || "", periodLabel: new Date().toLocaleDateString(), dir, stats, sections: [{ heading: title, headers, rows }], logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f", theme: "executiveGold" });
  return <ReportExportMenu label={lang === "ar" ? "تقرير الأداء" : "Performance report"} onPdf={pdf} onExcel={excel} disabled={disabled} lang={lang} />;
}