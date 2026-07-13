import { PDFDocument } from "pdf-lib";
import { base44 } from "@/api/base44Client";
import { makeVerificationBadgeCanvas } from "@/lib/verificationBadge";

// Renders the verification badge to PNG bytes using an ALREADY-LOADED QR image
// (prefetched while the user was choosing the file) — no network wait here.
async function badgePngBytes(sigId, signerName, qrImg) {
  const canvas = makeVerificationBadgeCanvas(sigId, signerName, qrImg);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  return { bytes: await blob.arrayBuffer(), ratio: canvas.height / canvas.width };
}

// Stamps the verification badge onto the PDF, uploads the signed copy and
// returns { url, bytes } — bytes are used to hash the file locally without
// re-downloading it.
export async function signPdfFile(docUrl, sigUrl, signerName, sigId, spot, qrImg) {
  const pdfBytes = await fetch(docUrl).then((r) => r.arrayBuffer());
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const badge = await badgePngBytes(sigId, signerName, qrImg);
  const badgeImg = await pdf.embedPng(badge.bytes);
  const pages = pdf.getPages();
  const page = spot ? pages[Math.min(spot.page - 1, pages.length - 1)] : pages[pages.length - 1];
  const { width, height } = page.getSize();
  const bw = Math.min(240, width * 0.42);
  const bh = bw * badge.ratio;
  let bx, by;
  if (spot) {
    // Center the badge on the chosen spot (spot.y measured from top).
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
  return { url: file_url, bytes: out };
}

// Wraps an already-signed image (PNG blob) into a one-page PDF sized to the
// image, uploads it and returns { url, bytes }.
export async function imageBlobToPdf(blob) {
  const bytes = await blob.arrayBuffer();
  const pdf = await PDFDocument.create();
  const img = await pdf.embedPng(bytes);
  const page = pdf.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  const out = await pdf.save();
  const file = new File([out], "signed-document.pdf", { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return { url: file_url, bytes: out };
}