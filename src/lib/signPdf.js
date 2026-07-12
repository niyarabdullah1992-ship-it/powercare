import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { base44 } from "@/api/base44Client";

const INK = rgb(0.12, 0.16, 0.23);

// Stamps the saved signature onto the LAST page of an uploaded PDF (bottom-right
// corner) with the date and the encrypted verification ID, then uploads the
// signed copy and returns its URL.
// `spot` (optional, from detectSignatureSpot): { page, x, y } — percentages from
// the top-left where the signature's center should land. Falls back to the
// bottom-right of the last page when absent.
export async function signPdfFile(docUrl, sigUrl, signerName, sigId, spot) {
  const [pdfBytes, sigBytes] = await Promise.all([
    fetch(docUrl).then((r) => r.arrayBuffer()),
    fetch(sigUrl).then((r) => r.arrayBuffer()),
  ]);
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const sigImg = await pdf.embedPng(sigBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const page = spot ? pages[Math.min(spot.page - 1, pages.length - 1)] : pages[pages.length - 1];
  const { width, height } = page.getSize();
  const sw = Math.min(160, width * 0.3);
  const sh = sw * (sigImg.height / sigImg.width);
  let x, y;
  if (spot) {
    // Center the signature on the detected blank area (spot.y measured from top).
    x = Math.min(Math.max((width * spot.x) / 100 - sw / 2, 8), width - sw - 8);
    y = Math.min(Math.max(height - (height * spot.y) / 100 - sh / 2, 40), height - sh - 8);
  } else {
    x = width - sw - 36;
    y = 64;
  }
  page.drawImage(sigImg, { x, y, width: sw, height: sh });
  // Helvetica can't encode Arabic — the drawn/typed signature image already
  // carries the name, so text lines stay ASCII-safe.
  const safeName = /^[\u0000-\u00FF]*$/.test(signerName || "") ? signerName : "";
  page.drawText(`${safeName ? safeName + "  -  " : ""}${new Date().toLocaleDateString("en-GB")}`, {
    x, y: y - 14, size: 10, font, color: INK,
  });
  if (sigId) page.drawText(`ID: ${sigId}`, { x, y: y - 28, size: 9, font, color: INK });
  const out = await pdf.save();
  const file = new File([out], "signed-document.pdf", { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

// Wraps an already-signed image (PNG blob) into a one-page PDF sized to the
// image, uploads it and returns its URL — so the emailed file is always a PDF.
export async function imageBlobToPdf(blob) {
  const bytes = await blob.arrayBuffer();
  const pdf = await PDFDocument.create();
  const img = await pdf.embedPng(bytes);
  const page = pdf.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  const out = await pdf.save();
  const file = new File([out], "signed-document.pdf", { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}