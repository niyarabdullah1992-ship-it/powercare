import { exportExcelColored } from "@/lib/exportExcelColored";
import { POWERCARE_LOGO_URL } from "@/lib/brand";

const esc = (value) => String(value ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function exportOwnerReportExcel({ filename, title, headers, rows, ar }) {
  exportExcelColored({ filename, title, headers, rows, dir: ar ? "rtl" : "ltr", theme: "ownerGlass" });
}

export function printOwnerReport({ title, headers, rows, ar }) {
  const dir = ar ? "rtl" : "ltr";
  const tableHead = headers.map((header) => `<th>${esc(header)}</th>`).join("");
  const tableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#071c2a;color:#f8fafc;font-family:Tahoma,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:297mm;min-height:210mm;padding:14mm 16mm;background:#071c2a url('https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/41a16d83e_generated_image.png') center/cover fixed no-repeat}.shell{min-height:182mm;padding:9mm;border:1px solid rgba(255,255,255,.18);border-radius:8mm;background:linear-gradient(145deg,rgba(12,42,59,.88),rgba(4,22,34,.7));box-shadow:0 10mm 28mm rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.14)}header{display:flex;align-items:center;gap:5mm;padding-bottom:7mm;border-bottom:1px solid rgba(255,255,255,.16)}.logo{width:18mm;height:18mm;object-fit:contain}.brand{flex:1}.brand small{color:#d4af37;font-weight:700;letter-spacing:.16em}.brand h1{margin:1.5mm 0 0;font-size:19px}.meta{text-align:end;color:rgba(248,250,252,.65);font-size:8px}.table-wrap{margin-top:7mm;overflow:hidden;border:1px solid rgba(255,255,255,.2);border-radius:5mm;background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(255,255,255,.045));box-shadow:inset 0 1px rgba(255,255,255,.13)}table{width:100%;border-collapse:collapse;font-size:8px}th{padding:3.5mm 3mm;background:rgba(7,28,42,.72);color:#f0cf72;text-align:start}td{padding:3mm;border-top:1px solid rgba(255,255,255,.12);color:rgba(248,250,252,.9)}tr:nth-child(even) td{background:rgba(255,255,255,.045)}footer{margin-top:6mm;text-align:center;color:rgba(248,250,252,.6);font-size:8px}</style></head><body><main class="page"><section class="shell"><header><img class="logo" src="${POWERCARE_LOGO_URL}" alt="PowerCare"><div class="brand"><small>POWERCARE • OWNER OPERATIONS</small><h1>${esc(title)}</h1></div><div class="meta">${new Date().toLocaleString(ar ? "ar-SA" : "en-GB")}<br>${rows.length} ${ar ? "سجل" : "records"}</div></header><div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table></div><footer>PowerCare <span style="color:#d4af37">•</span> ${ar ? "تقرير إداري رسمي منشأ إلكترونيًا" : "Official electronically generated management report"}</footer></section></main><script>onload=()=>setTimeout(()=>print(),500)</script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}