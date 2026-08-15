import { PDF_THEME } from "@/lib/pdfTheme";

const rgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

export function drawPdfCorporateFrame(pdf, title = "", pageNumber) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const [r, g, b] = rgb(PDF_THEME.navy);
  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, width, 2.2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.2);
  pdf.line(10, height - 8, width - 10, height - 8);
  pdf.setTextColor(90, 107, 133);
  pdf.setFontSize(7);
  pdf.text(title ? `NiroVera • ${title}` : "NiroVera", 10, height - 4.5);
  pdf.text(String(pageNumber || pdf.getNumberOfPages()), width - 10, height - 4.5, { align: "right" });
}
