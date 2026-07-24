// Downloads a colored, Excel-openable report (.xls via styled HTML — Excel keeps
// the colors, unlike plain CSV). Header row uses the company's brand color.
export function exportExcelColored({ filename, title, headers, rows, color = "#e0a43b", dir = "ltr", theme = "default" }) {
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const executive = theme === "executiveGold";
  const brandGold = String(color || "#e0a43b").toLowerCase() === "#b07d3f" ? "#E0A43B" : (color || "#E0A43B");
  const gold = executive ? "#E0A43B" : brandGold;
  const ink = "#13283D";
  const cream = executive ? "#F1EADC" : "#FAF8F2";
  const headerCells = headers.map((h) => `<th style="background:${ink};color:#ffffff;padding:11px 14px;border:1px solid ${gold};font-size:12px;font-weight:700;">${esc(h)}</th>`).join("");
  const bodyRows = rows.map((row, index) => {
    if (!row.length) return `<tr><td colspan="${headers.length}" style="height:14px;border:none;background:#ffffff;"></td></tr>`;
    if (executive && row.length === 1) return `<tr><td colspan="${headers.length}" style="padding:10px 14px;background:${gold};color:#ffffff;font-size:13px;font-weight:700;border:1px solid ${gold};">${esc(row[0])}</td></tr>`;
    const previous = rows[index - 1];
    const isSectionHeader = executive && index > 0 && (!previous?.length || previous.length === 1);
    const background = isSectionHeader ? ink : index % 2 === 0 ? "#ffffff" : cream;
    const textColor = isSectionHeader ? "#F0C56D" : "#13283D";
    return `<tr>${row.map((cell) => `<td style="padding:8px 12px;border:1px solid #D9C8AA;background:${background};color:${textColor};font-size:12px;${isSectionHeader ? "font-weight:700;" : ""}">${esc(cell)}</td>`).join("")}</tr>`;
  }).join("");
  const generated = new Date().toLocaleString(dir === "rtl" ? "ar-SA" : "en-GB");
  const banner = executive
    ? `<tr><td colspan="${headers.length}" style="height:7px;background:${gold};border:none;"></td></tr><tr><td colspan="${headers.length}" style="background:${ink};color:#F0C56D;padding:20px 16px 6px;border:none;font-size:10px;font-weight:700;letter-spacing:2px;">POWERCARE • HSE EXECUTIVE REPORT</td></tr><tr><td colspan="${headers.length}" style="background:${ink};color:#ffffff;padding:4px 16px 20px;border:none;font-size:21px;font-weight:700;">${esc(title)}</td></tr><tr><td colspan="${headers.length}" style="background:${cream};color:#657383;padding:8px 16px;border:none;font-size:10px;">${esc(generated)}</td></tr>`
    : `<tr><td colspan="${headers.length}" style="height:7px;background:${gold};border:none;"></td></tr><tr><td colspan="${headers.length}" style="background:${ink};color:#F0C56D;padding:16px 16px 5px;border:none;font-size:10px;font-weight:700;letter-spacing:2px;">POWERCARE • OFFICIAL REPORT</td></tr><tr><td colspan="${headers.length}" style="background:${ink};color:#ffffff;padding:3px 16px 17px;border:none;font-size:19px;font-weight:700;">${esc(title)}</td></tr><tr><td colspan="${headers.length}" style="background:${cream};color:#657383;padding:8px 16px;border:none;font-size:10px;">${esc(generated)}</td></tr>`;
  const html = `<html dir="${dir}" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Tahoma,Arial,sans-serif}td,th{vertical-align:middle}</style></head><body><table>${banner}<tr>${headerCells}</tr>${bodyRows}</table></body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}