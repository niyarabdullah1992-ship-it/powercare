import { PDFDocument } from "pdf-lib";
import { base44 } from "@/api/base44Client";
import { makeVerificationBadgePng } from "@/lib/verificationBadge";

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
  // Styled verification badge (fingerprint icon + encrypted ID + name & date).
  const badge = await makeVerificationBadgePng(sigId, signerName);
  const badgeImg = await pdf.embedPng(badge.bytes);
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
  // Stamp the verification badge just below the signature.
  const bw = Math.min(sw * 1.4, width - 16);
  const bh = bw * badge.ratio;
  const bx = Math.min(Math.max(x + sw / 2 - bw / 2, 8), width - bw - 8);
  const by = Math.max(y - bh - 6, 8);
  page.drawImage(badgeImg, { x: bx, y: by, width: bw, height: bh });
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