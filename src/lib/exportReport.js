import jsPDF from "jspdf";

// Exports tabular data as a CSV file (opens directly in Excel).
export function exportCSV(filename, headers, rows) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Exports tabular data as a simple paginated PDF file.
export function exportPDF(filename, title, headers, rows) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  let y = 25;
  doc.text(headers.join("   |   "), 14, y);
  y += 6;
  rows.forEach((r) => {
    if (y > 285) {
      doc.addPage();
      y = 15;
    }
    doc.text(r.map((c) => String(c ?? "")).join("   |   "), 14, y);
    y += 6;
  });
  doc.save(filename);
}