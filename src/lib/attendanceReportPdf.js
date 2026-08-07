// تقرير حضور الفريق — هوية NiroVera: كحلي #14274F وأخضر #107949 على خلفية بيضاء.
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
  return `<td${latin ? ' class="num"' : ""}>${esc(text)}</td>`;
};

const statusCell = (label) => {
  const [color, bg] = STATUS_COLORS[label] || ["#5C6E7A", "#EEF1F4"];
  return `<td><span class="status" style="color:${color};background:${bg}">${esc(label)}</span></td>`;
};

export function printAttendanceReport({
  title,
  period = "",
  companyName = "",
  kpis = [],
  headers = [],
  rows = [],
  statusIndex = 2,
  totalRow = null,
  distribution = [],
  averages = [],
  verify = null,
  dir = "rtl",
}) {
  const html = `<!doctype html><html dir="${dir}" lang="${dir === "rtl" ? "ar" : "en"}"><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #14274F; font-family: 'Noto Kufi Arabic', sans-serif; font-size: 11px; }
  .num, td.num, .kpi b, .date { font-family: 'Inter Tight', sans-serif; direction: ltr; unicode-bidi: embed; }
  .banner { background: ${NAVY}; color: #fff; padding: 16px 18px; border-inline-start: 5px solid ${GREEN}; }
  .banner h1 { margin: 0; font-size: 17px; font-weight: 700; }
  .banner p { margin: 5px 0 0; font-size: 11px; opacity: .85; }
  .kpis { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
  .kpi { flex: 1 1 120px; border: 1px solid #E1E8EE; border-top: 3px solid ${GREEN}; padding: 9px 11px; }
  .kpi span { display: block; font-size: 10px; color: #5C6E7A; }
  .kpi b { display: block; font-size: 17px; margin-top: 3px; }
  h2 { font-size: 12px; margin: 16px 0 7px; color: ${NAVY}; border-inline-start: 3px solid ${GREEN}; padding-inline-start: 7px; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th { background: ${NAVY}; color: #fff; font-size: 10px; font-weight: 600; padding: 7px 6px; text-align: ${dir === "rtl" ? "right" : "left"}; }
  td { padding: 6px; border-bottom: 1px solid #E9EEF3; text-align: ${dir === "rtl" ? "right" : "left"}; }
  tbody tr:nth-child(even) td { background: #F7F9FB; }
  tr.total td { background: #EEF3F7; font-weight: 700; border-top: 2px solid ${GREEN}; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .bar { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 10px; }
  .bar i { flex: 1; height: 8px; background: #EEF1F4; display: block; position: relative; }
  .bar i b { position: absolute; inset-inline-start: 0; top: 0; bottom: 0; display: block; }
  .bar span:first-child { width: 110px; }
  .verify { margin-top: 16px; border-top: 1px solid #E1E8EE; padding-top: 8px; font-size: 9px; color: #5C6E7A; }
</style></head><body>
  <div class="banner">
    <h1>${esc(title)}</h1>
    <p>${esc(companyName)}${companyName && period ? " · " : ""}<span class="date">${esc(period)}</span></p>
  </div>
  ${kpis.length ? `<div class="kpis">${kpis.map((kpi) => `<div class="kpi" style="border-top-color:${kpi.color || GREEN}"><span>${esc(kpi.label)}</span><b style="color:${kpi.color || NAVY}">${esc(kpi.value)}</b></div>`).join("")}</div>` : ""}
  <table>
    <thead><tr>${headers.map((header) => `<th>${esc(header)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((value, index) => (index === statusIndex ? statusCell(value) : cell(value))).join("")}</tr>`).join("")}
      ${totalRow ? `<tr class="total">${totalRow.map((value) => cell(value)).join("")}</tr>` : ""}
    </tbody>
  </table>
  ${distribution.length ? `<h2>${dir === "rtl" ? "توزيع الحالات" : "Status distribution"}</h2>${distribution.map((item) => `<div class="bar"><span>${esc(item.label)}</span><i><b style="width:${Number(item.percent) || 0}%;background:${item.color || GREEN}"></b></i><span class="num">${esc(item.value)} · ${Number(item.percent) || 0}%</span></div>`).join("")}` : ""}
  ${averages.length ? `<h2>${dir === "rtl" ? "متوسط الساعات لكل محطة" : "Average hours per site"}</h2>${averages.map((item) => `<div class="bar"><span>${esc(item.label)}</span><i><b style="width:${Number(item.percent) || 0}%;background:${NAVY}"></b></i><span class="num">${esc(item.value)}</span></div>`).join("")}` : ""}
  ${verify ? `<div class="verify"><span class="date">${esc(verify.url)}</span> · ${dir === "rtl" ? "بصمة" : "hash"} <span class="date">${esc(verify.hash)}</span></div>` : ""}
</body></html>`;

  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;inset:0;width:0;height:0;border:0;opacity:0";
  document.body.appendChild(frame);
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 1500);
  };
}