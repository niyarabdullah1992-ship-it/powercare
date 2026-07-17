import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { base44 } from "@/api/base44Client";
import { makeVerificationBadgeCanvas } from "@/lib/verificationBadge";
import { STAMP_CANVAS_HEIGHT, STAMP_CANVAS_WIDTH, STAMP_FALLBACK_SPOT, STAMP_WIDTH_PERCENT, clampStampScale, stampAspectRatio } from "@/lib/signatureStampGeometry";
import { getVisibleImageBounds } from "@/lib/signatureImageBounds";

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Builds the one canonical stamp image used by the web preview and the PDF.
export async function makeSignatureStamp(sigDataUrl, name, verificationId = "") {
  const img = await loadImage(sigDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = STAMP_CANVAS_WIDTH;
  canvas.height = STAMP_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.strokeStyle = "#d9c8ae";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(2, 2, 416, 186, 18);
  ctx.fill();
  ctx.stroke();
  const ink = getVisibleImageBounds(img);
  const scale = Math.min(360 / ink.width, 88 / ink.height);
  const w = ink.width * scale;
  const h = ink.height * scale;
  ctx.drawImage(img, ink.x, ink.y, ink.width, ink.height, (STAMP_CANVAS_WIDTH - w) / 2, 12 + (88 - h) / 2, w, h);
  ctx.strokeStyle = "#e7dfd3";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, 106);
  ctx.lineTo(392, 106);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#30271d";
  ctx.font = "600 17px sans-serif";
  ctx.fillText(String(name || "").slice(0, 40), 210, 130);
  ctx.fillStyle = "#7c7063";
  ctx.font = "12px sans-serif";
  ctx.fillText(new Date().toLocaleDateString("en-GB"), 210, 149);
  if (verificationId) {
    ctx.fillStyle = "#f8f1e7";
    ctx.strokeStyle = "#bd8d4f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(70, 157, 280, 24, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8a642f";
    ctx.font = "600 10px monospace";
    ctx.fillText(`VERIFIED • ${String(verificationId).slice(0, 40)}`, 210, 173);
  }
  return canvas.toDataURL("image/png");
}

// Stamps one signer's composed stamp onto the PDF. When `spot` is provided
// ({ page, x, y } — creator-assigned position, in % from the page's top-left),
// the signature is stamped ONLY there; otherwise it falls back to the shared
// slot rows along the bottom of the last page. When `badge` is provided (last
// signer), the verification badge is stamped at the top-right of the last
// page too. Uploads and returns { url, bytes }.
export async function stampOnPdf(docUrl, stampDataUrl, slotIndex, badge, spot, sizeScale = 1, uploadResult = true) {
  const scale = clampStampScale((Number(sizeScale) || 1) * 100) / 100;
  const pdfBytes = await fetch(docUrl).then((r) => r.arrayBuffer());
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const lastPage = pages[pages.length - 1];

  const stampBytes = await fetch(stampDataUrl).then((r) => r.arrayBuffer());
  const stampImg = await pdf.embedPng(stampBytes);

  const selectedSpot = spot?.page >= 1 ? spot : { ...STAMP_FALLBACK_SPOT, page: pages.length };
  const page = pages[Math.min(Math.max(Math.round(selectedSpot.page), 1), pages.length) - 1];
  const { width, height } = page.getSize();
  const sw = width * (STAMP_WIDTH_PERCENT / 100) * scale;
  const sh = sw * stampAspectRatio;
  const cx = (Number(selectedSpot.x) / 100) * width;
  const cy = height - (Number(selectedSpot.y) / 100) * height;
  page.drawImage(stampImg, { x: cx - sw / 2, y: cy - sh / 2, width: sw, height: sh });

  if (badge) {
    const { width, height } = lastPage.getSize();
    const verificationPage = pdf.addPage([width, height]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    verificationPage.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderWidth: 1, borderColor: rgb(0.86, 0.79, 0.68), color: rgb(0.99, 0.98, 0.96) });
    verificationPage.drawText("POWERCARE DIGITAL SIGNATURE", { x: 52, y: height - 88, size: 11, font: bold, color: rgb(0.61, 0.43, 0.2) });
    verificationPage.drawText("Verification certificate", { x: 52, y: height - 132, size: 25, font: bold, color: rgb(0.19, 0.15, 0.11) });
    verificationPage.drawText("This page confirms the encrypted identity and integrity of the signed document.", { x: 52, y: height - 158, size: 10, font, color: rgb(0.45, 0.4, 0.34) });
    const badgeCanvas = makeVerificationBadgeCanvas(badge.sigId, badge.name, badge.qr);
    const badgeBlob = await new Promise((resolve) => badgeCanvas.toBlob(resolve, "image/png"));
    const badgeImg = await pdf.embedPng(await badgeBlob.arrayBuffer());
    const bw = Math.min(490, width - 104);
    const bh = bw * (badgeCanvas.height / badgeCanvas.width);
    verificationPage.drawImage(badgeImg, { x: (width - bw) / 2, y: height / 2 - bh / 2, width: bw, height: bh });
    verificationPage.drawText("Verify this file at powercares.pro/verify", { x: 52, y: 62, size: 10, font, color: rgb(0.45, 0.4, 0.34) });
  }

  const out = await pdf.save();
  if (!uploadResult) return { url: null, bytes: out };
  const file = new File([out], "signed-document.pdf", { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return { url: file_url, bytes: out };
}