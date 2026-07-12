// Downloads a colored, Excel-openable report (.xls via styled HTML — Excel keeps
// the colors, unlike plain CSV). Header row uses the company's brand color.
export function exportExcelColored({ filename, title, headers, rows, color = "#b07d3f", dir = "ltr" }) {
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const headerCells = headers
    .map((h) => `<th style="background:${color};color:#ffffff;padding:8px 12px;border:1px solid ${color};font-size:12px;">${esc(h)}</th>`)
    .join("");
  const bodyRows = rows
    .map((r, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#f4efe8";
      return `<tr>${r.map((c) => `<td style="padding:6px 12px;border:1px solid #ddd2c2;background:${bg};font-size:12px;">${esc(c)}</td>`).join("")}</tr>`;
    })
    .join("");
  const html = `<html dir="${dir}" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><tr><td colspan="${headers.length}" style="font-size:16px;font-weight:bold;color:${color};padding:10px 12px;border:none;">${esc(title)}</td></tr><tr>${headerCells}</tr>${bodyRows}</table></body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}