import React from "react";
import ExportBar from "@/components/shared/ExportBar";

/** Shared Excel/PDF control for operational tables — wraps ExportBar. */
export default function ComparisonExportButtons({
  title,
  headers,
  rows,
  pdfHeaders,
  pdfRows,
  stats,
  theme,
  compact = false,
}) {
  if (!headers?.length) return null;
  return (
    <ExportBar
      title={title}
      headers={headers}
      rows={rows || []}
      pdfHeaders={pdfHeaders}
      pdfRows={pdfRows}
      stats={stats}
      theme={theme}
      compact={compact}
    />
  );
}
