import { PDF_THEME } from "@/lib/pdfTheme";
import { POWERCARE_LOGO_URL } from "@/lib/brand";
import { getReportVisualTheme } from "@/lib/reportVisualThemes";
import { deriveReportAnalytics } from "@/lib/reportAnalytics";
import { INVENTORY_REPORT_CSS, inventoryThemeClass } from "@/lib/inventoryReportThemes";

// Opens a print-ready, brand-styled report in a new window and triggers the
// browser's print dialog (user can save as PDF). Full RTL/Arabic support since
// it renders real HTML instead of drawing glyphs into a PDF canvas.
// Each company can supply its own logo and brand color; the color drives all
// accents in the document, with light tints derived via hex-alpha.
export function printReport({ title, companyName, periodLabel, dir = "ltr", stats = [], sections = [], logoUrl = "", color = "#e0a43b", theme = "default" }) {
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const accent = String(color || PDF_THEME.gold).toLowerCase() === "#b07d3f" ? PDF_THEME.gold : (color || PDF_THEME.gold);
  const visual = getReportVisualTheme(title);
  const isWide = theme === "inventorySimplified" ? false : theme === "attendanceModern" || theme === "executiveGold" || sections.some((section) => (section.headers || []).length > 8);
  const locale = dir === "rtl" ? "ar-SA" : "en-GB";
  const generatedAt = new Date().toLocaleString(locale);
  const sectionAnalytics = sections.map((section) => deriveReportAnalytics(section.headers, section.rows));
  const displayedStats = stats.length ? stats : sectionAnalytics.flatMap((item) => item.stats).slice(0, 4);
  const chartHtml = (chart) => `<div class="chart"><h3>${esc(chart.title)}</h3>${chart.entries.map((entry) => `<div class="bar-row"><span>${esc(entry.label)}</span><i><b style="width:${entry.percent}%"></b></i><strong>${esc(entry.display)}</strong></div>`).join("")}</div>`;

  const statsHtml = displayedStats.length
    ? `<div class="stats">${displayedStats.map((s) => `<div class="stat"><p class="val">${esc(s.value)}</p><p class="lbl">${esc(s.label)}</p></div>`).join("")}</div>`
    : "";

  const attendanceRows = sections.flatMap((section) => section.rows || []);
  const attendanceHeaders = sections[0]?.headers || [];
  const attendanceStatusIndex = attendanceHeaders.findIndex((header) => /status|الحالة/i.test(String(header)));
  const attendanceGroups = attendanceRows.reduce((groups, row) => {
    const label = String(row[attendanceStatusIndex] || "—");
    groups[label] = (groups[label] || 0) + 1;
    return groups;
  }, {});
  const attendanceEntries = Object.entries(attendanceGroups);
  const attendanceTotal = Math.max(attendanceRows.length, 1);
  const attendancePalette = ["#2f8f83", "#e0a43b", "#c74f4f", "#55768f", "#9aa5af"];
  let attendanceOffset = 0;
  const attendanceGradient = attendanceEntries.map(([, value], index) => {
    const start = attendanceOffset; attendanceOffset += (value / attendanceTotal) * 100;
    return `${attendancePalette[index % attendancePalette.length]} ${start}% ${attendanceOffset}%`;
  }).join(", ");
  const attendanceAnalyticsHtml = theme === "attendanceModern" && attendanceEntries.length ? `<section class="attendance-analysis"><div class="analysis-title"><small>${dir === "rtl" ? "التحليل التشغيلي" : "OPERATIONAL ANALYTICS"}</small><h2>${dir === "rtl" ? "تحليل الحضور" : "Attendance analysis"}</h2></div><div class="analysis-grid"><div class="donut-card"><div class="donut" style="background:conic-gradient(${attendanceGradient})"><div><strong>${attendanceRows.length}</strong><span>${dir === "rtl" ? "سجل" : "records"}</span></div></div><div class="legend">${attendanceEntries.map(([label, value], index) => `<p><i style="background:${attendancePalette[index % attendancePalette.length]}"></i><span>${esc(label)}</span><b>${value}</b></p>`).join("")}</div></div><div class="bars-card">${attendanceEntries.map(([label, value], index) => `<div class="attendance-bar"><span>${esc(label)}</span><i><b style="width:${Math.max(4, (value / attendanceTotal) * 100)}%;background:${attendancePalette[index % attendancePalette.length]}"></b></i><strong>${value}</strong></div>`).join("")}</div></div></section>` : "";

  const sectionsHtml = sections
    .map((sec, index) => `
      <h2>${esc(sec.heading)}</h2>
      ${sectionAnalytics[index].charts.map(chartHtml).join("")}
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
  body { position: relative; font-family: Tahoma, "Segoe UI", Arial, sans-serif; color: ${PDF_THEME.ink}; background: #fff; padding: 36px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .institutional-art { position: fixed; z-index: -1; inset: 8mm 7mm auto auto; width: 62mm; height: 38mm; opacity: .12; border: 1px solid ${visual.accent}; background-color: ${PDF_THEME.cream}; }
  .report-grid .institutional-art, .report-blueprint .institutional-art { background-image: linear-gradient(${visual.accent} 1px, transparent 1px), linear-gradient(90deg, ${visual.accent} 1px, transparent 1px); background-size: 8px 8px; }
  .report-shield .institutional-art, .report-timeline .institutional-art, .report-profile .institutional-art, .report-award .institutional-art { border-radius: 999px; box-shadow: 0 0 0 12px ${visual.accent}22, 0 0 0 24px ${visual.accent}11; }
  .report-workflow .institutional-art, .report-ledger .institutional-art, .report-receipt .institutional-art, .report-certificate .institutional-art, .report-classic .institutional-art { transform: skewX(-18deg); background-image: repeating-linear-gradient(135deg, transparent 0 10px, ${visual.accent} 11px 12px); }
  .top-rule { height: 7px; background: linear-gradient(90deg, ${PDF_THEME.ink} 0 72%, ${visual.accent} 72% 100%); margin-bottom: 22px; }
  .head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; margin-bottom: 22px; border-bottom: 1px solid ${PDF_THEME.line}; }
  .identity { display: flex; align-items: center; gap: 14px; }
  .monogram { width: 52px; height: 52px; display: grid; place-items: center; border: 1px solid ${accent}; color: ${accent}; font: 700 17px Georgia, serif; letter-spacing: .12em; }
  .head h1 { font: 600 25px Georgia, Tahoma, serif; color: ${PDF_THEME.ink}; letter-spacing: .01em; }
  .head .meta { font-size: 11px; color: ${PDF_THEME.muted}; margin-top: 6px; }
  .document-label { color: ${accent}; font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 6px; }
  .stats { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat { flex: 1; min-width: 110px; border: 1px solid ${PDF_THEME.line}; border-top: 3px solid ${accent}; padding: 13px 14px; background: ${PDF_THEME.cream}; }
  .stat .val { font: 700 23px Georgia, Tahoma, serif; color: ${PDF_THEME.ink}; }
  .stat .lbl { font-size: 10px; color: ${PDF_THEME.muted}; margin-top: 4px; }
  .chart { margin: 12px 0 20px; padding: 14px; border: 1px solid ${PDF_THEME.line}; background: ${PDF_THEME.cream}; break-inside: avoid; }
  .chart h3 { color: ${PDF_THEME.ink}; font: 700 12px Tahoma, sans-serif; margin-bottom: 10px; }
  .bar-row { display: grid; grid-template-columns: minmax(80px, 1fr) 3fr 58px; gap: 8px; align-items: center; margin: 6px 0; font-size: 9px; }
  .bar-row i { display: block; height: 10px; background: #fff; border: 1px solid ${PDF_THEME.line}; }
  .bar-row b { display: block; height: 100%; background: linear-gradient(90deg, ${PDF_THEME.ink}, ${accent}); }
  .bar-row strong { color: ${PDF_THEME.ink}; text-align: end; }
  h2 { font: 600 16px Georgia, Tahoma, serif; margin: 24px 0 10px; color: ${PDF_THEME.ink}; padding-bottom: 7px; border-bottom: 1px solid ${PDF_THEME.line}; }
  h2::before { content: ""; display: inline-block; width: 18px; height: 3px; margin-inline-end: 8px; vertical-align: middle; background: ${accent}; }
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
  .company-logo { margin-inline-start: auto; }
  .report-mark { margin-inline-start: auto; min-width: 58px; height: 58px; display: grid; place-items: center; border: 2px solid ${accent}; color: ${accent}; background: ${PDF_THEME.cream}; font: 700 15px Georgia, serif; letter-spacing: .06em; }
  .report-workflow .head { border-bottom: 4px solid ${accent}; }
  .report-workflow .stat { border-radius: 18px 3px 18px 3px; }
  .report-ledger table { border-top: 4px double ${accent}; border-bottom: 4px double ${accent}; }
  .report-ledger td { border-inline-end: 1px solid ${PDF_THEME.line}; }
  .report-grid body, .report-grid { background-image: linear-gradient(${PDF_THEME.line}55 1px, transparent 1px), linear-gradient(90deg, ${PDF_THEME.line}55 1px, transparent 1px); background-size: 24px 24px; }
  .report-grid table { outline: 2px solid ${PDF_THEME.ink}; }
  .report-receipt .head, .report-receipt .foot { border-style: dashed; }
  .report-receipt table { border-inline: 1px dashed ${PDF_THEME.line}; }
  .report-shield .report-mark { border-radius: 50% 50% 45% 45%; background: ${PDF_THEME.ink}; color: ${accent}; }
  .report-shield h2 { background: ${PDF_THEME.ink}; color: white; padding: 9px 12px; border: 0; }
  .report-timeline .stat { border: 0; border-inline-start: 5px solid ${accent}; }
  .report-timeline tbody tr td:first-child { border-inline-start: 3px solid ${accent}; }
  .report-profile .head { background: ${PDF_THEME.cream}; padding: 18px; border-inline-start: 8px solid ${accent}; }
  .report-profile .report-mark { border-radius: 999px; }
  .report-award .head { text-align: center; justify-content: center; border: 2px solid ${accent}; padding: 20px; }
  .report-award .report-mark { border-radius: 999px; box-shadow: 0 0 0 5px ${PDF_THEME.creamDeep}; }
  .report-blueprint .head { border: 1px solid ${PDF_THEME.ink}; box-shadow: inset 0 0 0 4px white, inset 0 0 0 5px ${PDF_THEME.line}; padding: 18px; }
  .report-blueprint th { border: 1px solid ${PDF_THEME.inkSoft}; }
  .report-certificate .head { border: 3px double ${accent}; padding: 22px; }
  .report-certificate .report-mark { transform: rotate(-3deg); }
  .executive-gold { color: #13283d; }
  .executive-gold .top-rule { height: 9px; background: linear-gradient(90deg, #13283d 0 68%, #e0a43b 68% 86%, #f0c56d 86% 100%); }
  .executive-gold .head { padding: 8px 4px 22px; border-bottom: 2px solid #e0a43b; }
  .executive-gold .monogram { width: 60px; height: 60px; border: 2px solid #e0a43b; background: #13283d; color: #f0c56d; box-shadow: 4px 4px 0 #f1eadc; }
  .executive-gold .document-label { color: #b57b16; letter-spacing: .24em; }
  .executive-gold .head h1 { font-size: 28px; color: #13283d; }
  .executive-gold .stats { gap: 12px; }
  .executive-gold .stat { border: 1px solid #d8d5cc; border-top: 4px solid #e0a43b; background: linear-gradient(145deg, #ffffff, #faf8f2); box-shadow: 0 4px 12px rgba(19,40,61,.08); }
  .executive-gold .stat .val { color: #13283d; font-size: 25px; }
  .executive-gold h2 { margin-top: 28px; padding: 9px 12px; border: 0; border-inline-start: 5px solid #e0a43b; background: #f1eadc; color: #13283d; }
  .executive-gold h2::before { display: none; }
  .executive-gold table { border: 1px solid #d8d5cc; box-shadow: 0 3px 10px rgba(19,40,61,.05); }
  .executive-gold th { background: #13283d; color: #f0c56d; border-color: #29445f; padding: 9px 8px; }
  .executive-gold td { border: 1px solid #e3e0d8; }
  .executive-gold tr:nth-child(even) td { background: #faf8f2; }
  .executive-gold .foot { border-top: 2px solid #e0a43b; color: #657383; }
  .attendance-modern { background: #f7f5ef; color: #13283d; }
  .attendance-modern .top-rule { height: 10px; border-radius: 0 0 8px 8px; background: linear-gradient(90deg,#13283d 0 70%,#e0a43b 70% 100%); }
  .attendance-modern .head { padding: 14px 18px 20px; border: 1px solid #d8d5cc; border-inline-start: 7px solid #e0a43b; border-radius: 14px; background: linear-gradient(135deg,#fff,#faf8f2); box-shadow: 0 8px 24px rgba(19,40,61,.08); }
  .attendance-modern .monogram,.attendance-modern .report-mark { border-radius: 14px; background:#13283d; color:#f0c56d; border-color:#e0a43b; }
  .attendance-modern .stats { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
  .attendance-modern .stat { min-width:0; border:1px solid #d8d5cc; border-top:4px solid #e0a43b; border-radius:10px; background:#fff; text-align:center; box-shadow:0 4px 12px rgba(19,40,61,.06); }
  .attendance-modern .stat .val { font-size:21px; }
  .attendance-modern h2 { border:0; border-inline-start:5px solid #e0a43b; border-radius:7px; padding:9px 12px; background:#f1eadc; }
  .attendance-modern h2::before { display:none; }
  .attendance-modern table { overflow:hidden; border:1px solid #d8d5cc; border-radius:10px; box-shadow:0 4px 14px rgba(19,40,61,.06); }
  .attendance-modern th { background:#13283d; color:#f0c56d; padding:9px 7px; }
  .attendance-modern td { border-bottom:1px solid #e4e0d6; padding:8px 7px; }
  .attendance-modern tr:nth-child(even) td { background:#faf8f2; }
  .attendance-analysis { margin-top:22px; break-inside:avoid; }
  .analysis-title small { color:#b57b16; font-size:8px; font-weight:700; letter-spacing:.16em; }
  .analysis-grid { display:grid; grid-template-columns:1fr 1.35fr; gap:12px; }
  .donut-card,.bars-card { display:flex; align-items:center; gap:16px; min-height:150px; padding:16px; border:1px solid #d8d5cc; border-radius:12px; background:#fff; }
  .donut { width:112px; height:112px; flex:0 0 auto; padding:18px; border-radius:50%; }
  .donut>div { width:100%; height:100%; display:grid; place-content:center; text-align:center; border-radius:50%; background:#fff; }
  .donut strong { font:700 23px Georgia,serif; }.donut span { display:block; color:#657383; font-size:8px; }
  .legend { flex:1; }.legend p { display:grid; grid-template-columns:8px 1fr auto; gap:7px; align-items:center; margin:7px 0; font-size:9px; }.legend i { width:7px; height:7px; border-radius:50%; }
  .bars-card { display:block; }.attendance-bar { display:grid; grid-template-columns:75px 1fr 28px; gap:8px; align-items:center; margin:10px 0; font-size:9px; }.attendance-bar>i { height:11px; overflow:hidden; border-radius:6px; background:#f1eadc; }.attendance-bar>i b { display:block; height:100%; border-radius:6px; }.attendance-bar strong { text-align:end; }
  ${INVENTORY_REPORT_CSS}
  @media print { body { padding: 0; } .top-rule { margin-top: 0; } .inventory-powercare { background: #faf7f2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body class="${isWide ? "wide" : "standard"} report-${visual.layout} ${theme === "executiveGold" ? "executive-gold" : ""} ${theme === "attendanceModern" ? "attendance-modern" : ""} ${inventoryThemeClass(theme)}">
  <div class="institutional-art" aria-hidden="true"></div>
  <div class="top-rule"></div>
  <div class="head">
    <div class="identity">
      <img src="${POWERCARE_LOGO_URL}" alt="PowerCare" />
      <div>
        <p class="document-label">PowerCare • ${esc(visual.label)}</p>
        <h1>${esc(title)}</h1>
        <p class="meta">${esc(companyName)}${periodLabel ? " — " + esc(periodLabel) : ""}</p>
      </div>
    </div>
    <div class="report-mark">${esc(visual.mark)}</div>
    ${logoUrl ? `<img class="company-logo" src="${logoUrl}" alt="${esc(companyName)}" />` : ""}
  </div>
  ${statsHtml}
  ${sectionsHtml}
  ${attendanceAnalyticsHtml}
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