// Opens a print-ready, brand-styled report in a new window and triggers the
// browser's print dialog (user can save as PDF). Full RTL/Arabic support since
// it renders real HTML instead of drawing glyphs into a PDF canvas.
// Each company can supply its own logo and brand color; the color drives all
// accents in the document, with light tints derived via hex-alpha.
export function printReport({ title, companyName, periodLabel, dir = "ltr", stats = [], sections = [], logoUrl = "", color = "#b07d3f" }) {
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const statsHtml = stats.length
    ? `<div class="stats">${stats.map((s) => `<div class="stat"><p class="val">${esc(s.value)}</p><p class="lbl">${esc(s.label)}</p></div>`).join("")}</div>`
    : "";

  const sectionsHtml = sections
    .map(
      (sec) => `
      <h2>${esc(sec.heading)}</h2>
      ${sec.rows.length === 0 ? `<p class="empty">—</p>` : `
      <table>
        <thead><tr>${sec.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${sec.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`}`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${dir === "rtl" ? "ar" : "en"}">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #3a2e22; padding: 32px; background: #fff; }
  .head { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${color}; padding-bottom: 16px; margin-bottom: 20px; }
  .head h1 { font-size: 22px; color: #3a2e22; }
  .head .meta { font-size: 12px; color: #8a7660; margin-top: 4px; }
  .stats { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
  .stat { flex: 1; min-width: 110px; border: 1px solid ${color}33; border-radius: 10px; padding: 12px 14px; background: ${color}0d; }
  .stat .val { font-size: 22px; font-weight: 700; color: ${color}; }
  .stat .lbl { font-size: 11px; color: #8a7660; margin-top: 3px; }
  h2 { font-size: 15px; margin: 22px 0 8px; color: #3a2e22; border-inline-start: 4px solid ${color}; padding-inline-start: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th { background: ${color}1a; text-align: start; padding: 7px 8px; border-bottom: 2px solid ${color}; color: #55483a; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 7px 8px; border-bottom: 1px solid ${color}22; }
  tr:nth-child(even) td { background: ${color}08; }
  .empty { font-size: 12px; color: #8a7660; padding: 8px 0; }
  .foot { margin-top: 28px; padding-top: 12px; border-top: 1px solid ${color}33; font-size: 10px; color: #8a7660; display: flex; justify-content: space-between; }
  .head img { width: 64px; height: 64px; object-fit: contain; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>${esc(title)}</h1>
      <p class="meta">${esc(companyName)}${periodLabel ? " — " + esc(periodLabel) : ""}</p>
    </div>
    ${logoUrl ? `<img src="${logoUrl}" alt="${esc(companyName)}" />` : ""}
  </div>
  ${statsHtml}
  ${sectionsHtml}
  <div class="foot">
    <span>${esc(companyName)}</span>
    <span>${new Date().toLocaleString(dir === "rtl" ? "ar" : "en")}</span>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}