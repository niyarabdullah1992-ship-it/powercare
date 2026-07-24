import { exportExcelColored } from "@/lib/exportExcelColored";

// Legacy callers now receive the same branded, Excel-openable workbook used by every report.
export function exportCSV(filename, headers, rows) {
  const cleanName = String(filename || "powercare-report").replace(/\.(csv|xls|xlsx)$/i, "");
  exportExcelColored({ filename: cleanName, title: cleanName.replace(/[_-]+/g, " "), headers, rows });
}