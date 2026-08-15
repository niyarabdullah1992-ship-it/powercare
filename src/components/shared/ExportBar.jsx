import React from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { brandReportColor, PDF_THEME } from "@/lib/pdfTheme";
import { ACCENT, BORDER, CARD, NAVY } from "@/lib/platformStyles";

export default function ExportBar({
  title,
  headers,
  rows,
  pdfHeaders = headers,
  pdfRows = rows,
  stats = [],
  theme = "default",
  compact = false,
}) {
  const { t, lang } = useI18n();
  const { company, data } = useAuth();
  const ar = lang === "ar";
  const branding = data?.reportBranding || {};
  const color = brandReportColor(branding.color || PDF_THEME.navy);
  const companyName = company?.name || data?.name || "";
  const logoUrl = branding.logoUrl || "";
  const dir = ar ? "rtl" : "ltr";
  const filename = String(title || "report").replace(/[^\w\u0600-\u06FF-]+/g, "_").slice(0, 80);

  const doExcel = () => {
    exportExcelColored({
      filename,
      title,
      headers,
      rows,
      color,
      dir,
      companyName,
      logoUrl,
    });
  };

  const doPdf = () => {
    printReport({
      title,
      companyName,
      dir,
      stats,
      theme,
      logoUrl,
      color,
      sections: [{ heading: title, headers: pdfHeaders, rows: pdfRows }],
    });
  };

  const btn = {
    display: "inline-flex",
    alignItems: "center",
    gap: compact ? 5 : 6,
    height: compact ? 28 : 32,
    padding: compact ? "0 9px" : "0 12px",
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    background: CARD,
    color: NAVY,
    fontSize: compact ? 11 : 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <button type="button" onClick={doExcel} style={btn} disabled={!rows?.length}>
        <FileSpreadsheet style={{ width: 14, height: 14, color: ACCENT }} />
        {t("exportExcel")}
      </button>
      <button type="button" onClick={doPdf} style={btn} disabled={!rows?.length}>
        <Printer style={{ width: 14, height: 14, color: NAVY }} />
        {t("exportPdf")}
      </button>
    </div>
  );
}
