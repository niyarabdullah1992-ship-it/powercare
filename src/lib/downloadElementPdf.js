import { drawPdfCorporateFrame } from "@/lib/pdfCorporateArt";

export async function downloadElementPdf(element, fileName) {
  if (!element) return;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const renderOptions = { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false };

  // Each document sheet is captured on its own so no text line is ever sliced
  // in half between two PDF pages.
  const sheets = Array.from(element.querySelectorAll(".guide-page"));
  if (sheets.length) {
    for (let index = 0; index < sheets.length; index += 1) {
      if (index) pdf.addPage();
      const sheetCanvas = await html2canvas(sheets[index], renderOptions);
      const renderedHeight = Math.min((sheetCanvas.height * pageWidth) / sheetCanvas.width, pageHeight);
      pdf.addImage(sheetCanvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, pageWidth, renderedHeight, undefined, "FAST");
      drawPdfCorporateFrame(pdf, fileName, index + 1);
    }
    pdf.save(fileName);
    return;
  }

  const canvas = await html2canvas(element, renderOptions);
  const pageHeightPx = Math.floor((canvas.width * pageHeight) / pageWidth);

  for (let offset = 0, page = 0; offset < canvas.height; offset += pageHeightPx, page += 1) {
    if (page) pdf.addPage();
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offset);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const context = slice.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    const renderedHeight = (sliceHeight * pageWidth) / canvas.width;
    pdf.addImage(slice.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, pageWidth, renderedHeight, undefined, "FAST");
    drawPdfCorporateFrame(pdf, fileName, page + 1);
  }

  pdf.save(fileName);
}