import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { base44 } from "@/api/base44Client";
import { makeVerificationBadgeCanvas } from "@/lib/verificationBadge";

// Renders the verification badge to PNG bytes using an ALREADY-LOADED QR image
// (prefetched while the user was choosing the file) — no network wait here.
async function badgePngBytes(sigId, signerName, qrImg) {
  const canvas = makeVerificationBadgeCanvas(sigId, signerName, qrImg);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  return { bytes: await blob.arrayBuffer(), ratio: canvas.height / canvas.width };
}

export async function drawTextField(pdf, page, field, rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return;
  const { width, height } = page.getSize();
  const scale = Math.min(2, Math.max(0.5, Number(field.scale || 100) / 100));
  const boxWidth = width * 0.26 * scale;
  const boxHeight = Math.max(20, height * 0.055 * scale);
  const centerX = width * Number(field.x || 0) / 100;
  const centerY = height - height * Number(field.y || 0) / 100;
  const fontSize = Math.min(18, Math.max(8, boxHeight * 0.42));
  try {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let printable = value;
    while (printable.length > 1 && font.widthOfTextAtSize(printable, fontSize) > boxWidth - 8) printable = `${printable.slice(0, -2)}…`;
    page.drawText(printable, { x: centerX - boxWidth / 2 + 4, y: centerY - fontSize / 2, size: fontSize, font, color: rgb(0.08, 0.12, 0.18), maxWidth: boxWidth - 8 });
  } catch {
    const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 220;
    const context = canvas.getContext("2d"); context.fillStyle = "#111827"; context.font = "52px Arial"; context.textAlign = "center"; context.textBaseline = "middle"; context.direction = /[\u0600-\u06ff]/.test(value) ? "rtl" : "ltr"; context.fillText(value.slice(0, 160), 600, 110, 1160);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const image = await pdf.embedPng(await blob.arrayBuffer());
    page.drawImage(image, { x: centerX - boxWidth / 2, y: centerY - boxHeight / 2, width: boxWidth, height: boxHeight });
  }
}

// Stamps the verification badge onto the PDF, uploads the signed copy and
// returns { url, bytes } — bytes are used to hash the file locally without
// re-downloading it.
export async function signPdfFile(docUrl, sigUrl, signerName, sigId, spot, qrImg, sizeScale = 1, uploadResult = true) {
  const sc = Math.min(Math.max(Number(sizeScale) || 1, 0.5), 2);
  const pdfBytes = await fetch(docUrl).then((r) => r.arrayBuffer());
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const badge = await badgePngBytes(sigId, signerName, qrImg);
  const badgeImg = await pdf.embedPng(badge.bytes);
  const pages = pdf.getPages();
  const page = spot ? pages[Math.min(spot.page - 1, pages.length - 1)] : pages[pages.length - 1];
  const { width, height } = page.getSize();
  const bw = Math.min(240, width * 0.42) * sc;
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
  if (!uploadResult) return { url: null, bytes: out };
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