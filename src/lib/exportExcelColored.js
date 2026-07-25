import { getReportVisualTheme } from "@/lib/reportVisualThemes";
import { deriveReportAnalytics } from "@/lib/reportAnalytics";

export function exportExcelColored({ filename, title, headers, rows, color = "#e0a43b", dir = "ltr", theme = "default" }) {
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const executive = theme === "executiveGold";
  const visual = getReportVisualTheme(title);
  const analytics = deriveReportAnalytics(headers, rows);
  const gold = executive ? "#E0A43B" : (String(color).toLowerCase() === "#b07d3f" ? "#E0A43B" : color);
  const ink = "#13283D";
  const cream = executive ? "#F1EADC" : "#FAF8F2";
  const borderStyle = visual.layout === "receipt" ? "dashed" : visual.layout === "ledger" ? "double" : "solid";
  const columnCount = Math.max(headers.length, 3);
  const columnWidths = Array.from({ length: columnCount }, (_, index) => {
    const values = [headers[index], ...rows.filter((row) => row.length === headers.length).map((row) => row[index])];
    const longest = Math.max(...values.map((value) => String(value ?? "").length), 10);
    return Math.min(260, Math.max(115, longest * 9 + 32));
  });
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const columns = `<colgroup>${columnWidths.map((width) => `<col width="${width}" style="width:${width}px;mso-width-source:userset;" />`).join("")}</colgroup>`;
  const generated = new Date().toLocaleString(dir === "rtl" ? "ar-SA" : "en-GB");
  const headerCells = headers.map((h) => `<th style="height:34px;background:${ink};color:#F0C56D;padding:12px 16px;border:1px ${borderStyle} ${gold};font-size:14px;font-weight:700;white-space:nowrap;">${esc(h)}</th>`).join("");
  const bodyRows = rows.map((row, index) => {
    if (!row.length) return `<tr><td colspan="${columnCount}" style="height:14px;border:none;background:#ffffff;"></td></tr>`;
    if (row.length === 1) return `<tr><td colspan="${columnCount}" style="padding:10px 14px;background:${gold};color:${ink};font-size:13px;font-weight:700;border:1px solid ${gold};">${esc(row[0])}</td></tr>`;
    const background = index % 2 === 0 ? "#ffffff" : cream;
    return `<tr style="height:30px;">${row.map((cell) => `<td style="padding:9px 14px;border:1px ${borderStyle} #D8D5CC;background:${background};color:${ink};font-size:13px;white-space:nowrap;">${esc(cell)}</td>`).join("")}</tr>`;
  }).join("");
  const summary = analytics.stats.length ? `<tr><td colspan="${columnCount}" style="background:${cream};color:${ink};padding:12px 16px;font-size:14px;font-weight:700;border-top:3px solid ${gold};">${dir === "rtl" ? "الملخص التنفيذي" : "EXECUTIVE SUMMARY"}</td></tr>${analytics.stats.map((stat) => `<tr><td style="padding:8px 12px;background:${ink};color:#F0C56D;font-weight:700;">${esc(stat.value)}</td><td colspan="${columnCount - 1}" style="padding:8px 12px;background:${cream};color:${ink};">${esc(stat.label)}</td></tr>`).join("")}` : "";
  const charts = analytics.charts.map((chart) => `<tr><td colspan="${columnCount}" style="height:38px;padding:16px 18px 9px;background:#ffffff;color:${ink};font-size:15px;font-weight:700;border-top:3px solid ${gold};">${esc(chart.title)}</td></tr>${chart.entries.map((entry) => `<tr style="height:28px;"><td style="padding:8px 12px;color:${ink};font-size:12px;font-weight:600;white-space:nowrap;">${esc(entry.label)}</td><td colspan="${columnCount - 2}" style="padding:8px 14px;background:#ffffff;color:${gold};font-family:Consolas,monospace;font-size:15px;letter-spacing:1px;white-space:nowrap;">${"█".repeat(Math.ceil(entry.percent / 5))}</td><td style="padding:8px 12px;background:${cream};color:${ink};font-size:12px;font-weight:700;text-align:center;">${esc(entry.display)}</td></tr>`).join("")}`).join("");
  const banner = `<tr><td colspan="${columnCount}" style="height:9px;background:${gold};border:none;"></td></tr><tr><td colspan="${columnCount}" style="background:${ink};color:#F0C56D;padding:16px 16px 5px;border:none;font-size:10px;font-weight:700;letter-spacing:2px;">POWERCARE • ${esc(visual.label)}</td></tr><tr><td colspan="${columnCount}" style="background:${ink};color:#ffffff;padding:3px 16px 17px;border:none;font-size:19px;font-weight:700;border-${dir === "rtl" ? "right" : "left"}:8px solid ${gold};">${esc(visual.mark)} &nbsp; ${esc(title)}</td></tr><tr><td colspan="${columnCount}" style="background:${cream};color:#657383;padding:8px 16px;border:none;border-bottom:2px ${borderStyle} ${gold};">${esc(generated)}</td></tr>`;
  const html = `<html dir="${dir}" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><style>body{margin:18px;background:#fff}table{width:${tableWidth}px;table-layout:fixed;border-collapse:collapse;font-family:Tahoma,Arial,sans-serif}td,th{vertical-align:middle;mso-number-format:\"General\"}</style></head><body><table>${columns}${banner}${summary}${charts}<tr>${headerCells}</tr>${bodyRows}</table></body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}