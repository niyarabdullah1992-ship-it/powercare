// تصدير Excel لتقرير الحضور (جدول HTML بامتداد .xls) بهوية NiroVera الكحلية/الخضراء.
const NAVY = "#14274F";
const GREEN = "#107949";

const STATUS_COLORS = {
  "حاضر": ["#107949", "#E7F4EE"],
  "Present": ["#107949", "#E7F4EE"],
  "متأخر": ["#B45309", "#FDF3E3"],
  "Late": ["#B45309", "#FDF3E3"],
  "غائب": ["#B3261E", "#FBEAE8"],
  "Absent": ["#B3261E", "#FBEAE8"],
  "في إجازة": ["#1E5F8A", "#E9F1F7"],
  "On leave": ["#1E5F8A", "#E9F1F7"],
  "غير مجدول": ["#5C6E7A", "#EEF1F4"],
  "Not scheduled": ["#5C6E7A", "#EEF1F4"],
};

const esc = (value) =>
  String(value ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const cell = (value) => {
  const text = value === "" || value == null ? "—" : String(value);
  const latin = /^[\d\-:.\s/]+$/.test(text);
  return `<td style="border:1px solid #E9EEF3;padding:5px${latin ? ";mso-number-format:'@';direction:ltr" : ""}">${esc(text)}</td>`;
};

export function exportAttendanceExcel({
  filename = "attendance-report",
  title,
  period = "",
  headers = [],
  rows = [],
  statusIndex = 2,
  summary = [],
  distribution = [],
  totalRow = null,
  dir = "rtl",
}) {
  const span = headers.length || 1;
  const html = `<html dir="${dir}"><head><meta charset="utf-8" /></head><body>
<table style="border-collapse:collapse;font-family:'Noto Kufi Arabic',sans-serif;font-size:11pt">
  <tr><td colspan="${span}" style="background:${NAVY};color:#fff;font-size:14pt;font-weight:bold;padding:10px;border-bottom:3px solid ${GREEN}">${esc(title)}</td></tr>
  <tr><td colspan="${span}" style="padding:6px;color:${NAVY}">${esc(period)}</td></tr>
  ${summary.length ? `<tr>${summary.map((item) => `<td colspan="${Math.max(1, Math.floor(span / summary.length))}" style="border:1px solid #E1E8EE;padding:6px;background:#F7F9FB;color:${NAVY}"><b>${esc(item.value)}</b> — ${esc(item.label)}</td>`).join("")}</tr>` : ""}
  <tr><td colspan="${span}"></td></tr>
  <tr>${headers.map((header) => `<th style="background:${NAVY};color:#fff;border:1px solid ${NAVY};padding:6px">${esc(header)}</th>`).join("")}</tr>
  ${rows.map((row, index) => `<tr${index % 2 ? ' style="background:#F7F9FB"' : ""}>${row.map((value, column) => {
    if (column !== statusIndex) return cell(value);
    const [color, bg] = STATUS_COLORS[value] || ["#5C6E7A", "#EEF1F4"];
    return `<td style="border:1px solid #E9EEF3;padding:5px;color:${color};background:${bg};font-weight:bold">${esc(value)}</td>`;
  }).join("")}</tr>`).join("")}
  ${totalRow ? `<tr>${totalRow.map((value) => `<td style="background:#EEF3F7;border:1px solid #E9EEF3;border-top:2px solid ${GREEN};padding:5px;font-weight:bold">${esc(value === "" ? "—" : value)}</td>`).join("")}</tr>` : ""}
  ${distribution.length ? `<tr><td colspan="${span}"></td></tr>${distribution.map((item) => `<tr><td colspan="${span}" style="padding:5px;border:1px solid #E9EEF3;color:${NAVY}">${esc(item.label)} — ${esc(item.display ?? `${item.percent}%`)}</td></tr>`).join("")}` : ""}
</table></body></html>`;

  const url = URL.createObjectURL(new Blob([`\ufeff${html}`], { type: "application/vnd.ms-excel;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}