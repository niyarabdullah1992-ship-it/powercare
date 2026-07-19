import { PDF_THEME } from "@/lib/pdfTheme";

// Opens a print-ready, brand-styled report in a new window and triggers the
// browser's print dialog (user can save as PDF). Full RTL/Arabic support since
// it renders real HTML instead of drawing glyphs into a PDF canvas.
// Each company can supply its own logo and brand color; the color drives all
// accents in the document, with light tints derived via hex-alpha.
export function printReport({ title, companyName, periodLabel, dir = "ltr", stats = [], sections = [], logoUrl = "", color = "#b07d3f", theme = "default" }) {
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const isWide = theme === "executiveGold" || sections.some((section) => (section.headers || []).length > 8);
  const locale = dir === "rtl" ? "ar-SA" : "en-GB";
  const generatedAt = new Date().toLocaleString(locale);

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
  @page { size: A4 ${isWide ? "landscape" : "portrait"}; margin: 14mm; }
  body { font-family: Tahoma, "Segoe UI", Arial, sans-serif; color: ${PDF_THEME.ink}; background: #fff; padding: 36px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .top-rule { height: 7px; background: linear-gradient(90deg, ${PDF_THEME.ink} 0 72%, ${color} 72% 100%); margin-bottom: 22px; }
  .head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; margin-bottom: 22px; border-bottom: 1px solid ${PDF_THEME.line}; }
  .identity { display: flex; align-items: center; gap: 14px; }
  .monogram { width: 52px; height: 52px; display: grid; place-items: center; border: 1px solid ${color}; color: ${color}; font: 700 17px Georgia, serif; letter-spacing: .12em; }
  .head h1 { font: 600 25px Georgia, Tahoma, serif; color: ${PDF_THEME.ink}; letter-spacing: .01em; }
  .head .meta { font-size: 11px; color: ${PDF_THEME.muted}; margin-top: 6px; }
  .document-label { color: ${color}; font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 6px; }
  .stats { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat { flex: 1; min-width: 110px; border: 1px solid ${PDF_THEME.line}; border-top: 3px solid ${color}; padding: 13px 14px; background: ${PDF_THEME.cream}; }
  .stat .val { font: 700 23px Georgia, Tahoma, serif; color: ${PDF_THEME.ink}; }
  .stat .lbl { font-size: 10px; color: ${PDF_THEME.muted}; margin-top: 4px; }
  h2 { font: 600 16px Georgia, Tahoma, serif; margin: 24px 0 10px; color: ${PDF_THEME.ink}; padding-bottom: 7px; border-bottom: 1px solid ${PDF_THEME.line}; }
  h2::before { content: ""; display: inline-block; width: 18px; height: 3px; margin-inline-end: 8px; vertical-align: middle; background: ${color}; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 16px; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th { background: ${PDF_THEME.ink}; color: #fff; text-align: start; padding: 8px; border-inline-end: 1px solid ${PDF_THEME.inkSoft}; font-size: 9px; font-weight: 600; }
  td { padding: 8px; border-bottom: 1px solid ${PDF_THEME.line}; vertical-align: top; }
  tr:nth-child(even) td { background: ${PDF_THEME.cream}; }
  .wide table { table-layout: fixed; font-size: 6.5px; }
  .wide th, .wide td { padding: 5px 3px; text-align: center; overflow-wrap: anywhere; }
  .wide th:first-child, .wide td:first-child { width: 13%; text-align: start; font-weight: 600; }
  .empty { font-size: 12px; color: ${PDF_THEME.muted}; padding: 10px 0; }
  .foot { margin-top: 30px; padding-top: 10px; border-top: 1px solid ${PDF_THEME.line}; font-size: 9px; color: ${PDF_THEME.muted}; display: flex; justify-content: space-between; }
  .head img { width: 58px; height: 58px; object-fit: contain; }
  .executive-gold { color: #2d2117; }
  .executive-gold .top-rule { height: 9px; background: linear-gradient(90deg, #21150d 0 68%, #b8873a 68% 86%, #ddb96d 86% 100%); }
  .executive-gold .head { padding: 8px 4px 22px; border-bottom: 2px solid #b8873a; }
  .executive-gold .monogram { width: 60px; height: 60px; border: 2px solid #b8873a; background: #21150d; color: #ddb96d; box-shadow: 4px 4px 0 #ead9b7; }
  .executive-gold .document-label { color: #9b6a25; letter-spacing: .24em; }
  .executive-gold .head h1 { font-size: 28px; color: #21150d; }
  .executive-gold .stats { gap: 12px; }
  .executive-gold .stat { border: 1px solid #d9c49e; border-top: 4px solid #b8873a; background: linear-gradient(145deg, #fffdf8, #f4ead7); box-shadow: 0 4px 12px rgba(59,39,20,.08); }
  .executive-gold .stat .val { color: #8b5f25; font-size: 25px; }
  .executive-gold h2 { margin-top: 28px; padding: 9px 12px; border: 0; border-inline-start: 5px solid #b8873a; background: #f4ead7; color: #21150d; }
  .executive-gold h2::before { display: none; }
  .executive-gold table { border: 1px solid #d9c49e; box-shadow: 0 3px 10px rgba(59,39,20,.05); }
  .executive-gold th { background: #21150d; color: #f5ddb0; border-color: #6f512e; padding: 9px 8px; }
  .executive-gold td { border: 1px solid #e5d8c2; }
  .executive-gold tr:nth-child(even) td { background: #f8f2e7; }
  .executive-gold .foot { border-top: 2px solid #b8873a; color: #765d40; }
  @media print { body { padding: 0; } .top-rule { margin-top: 0; } }
</style>
</head>
<body class="${isWide ? "wide" : "standard"} ${theme === "executiveGold" ? "executive-gold" : ""}">
  <div class="top-rule"></div>
  <div class="head">
    <div class="identity">
      ${logoUrl ? `<img src="${logoUrl}" alt="${esc(companyName)}" />` : `<div class="monogram">PC</div>`}
      <div>
        <p class="document-label">PowerCare • Official Report</p>
        <h1>${esc(title)}</h1>
        <p class="meta">${esc(companyName)}${periodLabel ? " — " + esc(periodLabel) : ""}</p>
      </div>
    </div>
  </div>
  ${statsHtml}
  ${sectionsHtml}
  <div class="foot">
    <span>PowerCare • ${esc(companyName)}</span>
    <span>${esc(generatedAt)}</span>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}