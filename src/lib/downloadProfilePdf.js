import { drawPdfCorporateFrame } from "@/lib/pdfCorporateArt";

export async function downloadProfilePdf(container, onProgress, fileName = "NiroVera-Corporate-Profile-AR-EN-2026.pdf") {
  if (!container) return;
  const pages = [...container.querySelectorAll("[data-pdf-page]")];
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  for (let index = 0; index < pages.length; index += 1) {
    onProgress?.(index + 1, pages.length);
    const canvas = await html2canvas(pages[index], { scale: 1.35, useCORS: true, backgroundColor: "#f8f5ef", logging: false });
    if (index) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", .9), "JPEG", 0, 0, 210, 297, undefined, "FAST");
    drawPdfCorporateFrame(pdf, fileName, index + 1);
  }
  pdf.save(fileName);
}