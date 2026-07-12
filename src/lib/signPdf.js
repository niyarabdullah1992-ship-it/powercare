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
  const pdfBytes = await fetch(docUrl).then((r) => r.arrayBuffer());
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  // Only the verification badge is stamped (fingerprint icon + encrypted ID +
  // signer name & date) — the name lives inside the rectangle itself.
  const badge = await makeVerificationBadgePng(sigId, signerName);
  const badgeImg = await pdf.embedPng(badge.bytes);
  const pages = pdf.getPages();
  const page = spot ? pages[Math.min(spot.page - 1, pages.length - 1)] : pages[pages.length - 1];
  const { width, height } = page.getSize();
  const bw = Math.min(240, width * 0.42);
  const bh = bw * badge.ratio;
  let bx, by;
  if (spot) {
    // Center the badge on the chosen/detected spot (spot.y measured from top).
    bx = Math.min(Math.max((width * spot.x) / 100 - bw / 2, 8), width - bw - 8);
    by = Math.min(Math.max(height - (height * spot.y) / 100 - bh / 2, 8), height - bh - 8);
  } else {
    bx = width - bw - 36;
    by = 48;
  }
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