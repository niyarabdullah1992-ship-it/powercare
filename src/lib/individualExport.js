// Lightweight PDF / Excel export for the individual workspace sections.
// Excel: CSV with BOM (Arabic-safe, opens directly in Excel).
// PDF: styled print window — the user saves it as PDF from the print dialog.

export function exportExcel(filename, headers, rows) {
  const esc = (c) => `"${String(c ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportPDF(title, headers, rows, ar) {
  const w = window.open("", "_blank");
  if (!w) return;
  const cells = (arr, tag) => arr.map((c) => `<${tag}>${String(c ?? "")}</${tag}>`).join("");
  w.document.write(`<!DOCTYPE html><html dir="${ar ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:'Segoe UI',Tahoma,sans-serif;padding:32px;color:#2a2118}
  h1{font-size:20px;border-bottom:2px solid #b8894a;padding-bottom:10px;color:#b8894a}
  p.meta{font-size:11px;color:#888}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
  th{background:#f5ead9;color:#6b4f2a;text-align:${ar ? "right" : "left"};padding:8px;border:1px solid #e5d5bd}
  td{padding:7px 8px;border:1px solid #eee}
  tr:nth-child(even) td{background:#faf7f2}
</style></head><body>
<h1>${title}</h1>
<p class="meta">${new Date().toLocaleString(ar ? "ar-SA" : "en-GB")} — PowerCare</p>
<table><thead><tr>${cells(headers, "th")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${cells(r, "td")}</tr>`).join("")}</tbody></table>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
  w.document.close();
}