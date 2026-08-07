import { getReportVisualTheme } from "@/lib/reportVisualThemes";

const rgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

export function drawPdfCorporateFrame(pdf, title = "", pageNumber) {
  const visual = getReportVisualTheme(title);
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const [r, g, b] = rgb(visual.accent);
  pdf.setFillColor(19, 40, 61);
  pdf.rect(0, 0, width * 0.72, 2.2, "F");
  pdf.setFillColor(r, g, b);
  pdf.rect(width * 0.72, 0, width * 0.28, 2.2, "F");
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(0.35);
  if (visual.pattern === "grid") {
    for (let x = width - 24; x < width; x += 4) pdf.line(x, 3, x, 19);
    for (let y = 3; y < 20; y += 4) pdf.line(width - 25, y, width, y);
  } else if (visual.pattern === "rings") {
    for (let radius = 4; radius <= 12; radius += 4) pdf.circle(width - 8, 9, radius, "S");
  } else {
    pdf.line(width - 28, 3, width, 19);
    pdf.line(width - 18, 3, width, 13);
    pdf.line(width - 8, 3, width, 7);
  }
  pdf.setDrawColor(216, 213, 204);
  pdf.line(10, height - 8, width - 10, height - 8);
  pdf.setTextColor(101, 115, 131);
  pdf.setFontSize(7);
  pdf.text(`NiroVera • ${visual.label}`, 10, height - 4.5);
  pdf.text(String(pageNumber || pdf.getNumberOfPages()), width - 10, height - 4.5, { align: "right" });
}