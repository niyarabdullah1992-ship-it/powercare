import { PDFDocument } from "pdf-lib";
import { base44 } from "@/api/base44Client";
import { makeVerificationBadgeCanvas } from "@/lib/verificationBadge";

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Composes the signature, signer identity, date, and the document's encrypted
// verification ID into one Unicode-safe PNG embedded directly in the PDF.
export async function makeSignatureStamp(sigDataUrl, name, verificationId = "") {
  const img = await loadImage(sigDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 230;
  const ctx = canvas.getContext("2d");
  const scale = Math.min(340 / img.width, 112 / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (360 - w) / 2, (118 - h) / 2, w, h);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, 128);
  ctx.lineTo(346, 128);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#1e293b";
  ctx.font = "600 20px sans-serif";
  ctx.fillText(String(name || "").slice(0, 40), 180, 153);
  ctx.fillStyle = "#64748b";
  ctx.font = "13px sans-serif";
  ctx.fillText(new Date().toLocaleDateString(), 180, 174);
  if (verificationId) {
    ctx.fillStyle = "#f6f1e8";
    ctx.strokeStyle = "#bd8d4f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(40, 187, 280, 29, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8a642f";
    ctx.font = "600 13px monospace";
    ctx.fillText(`VERIFIED • ${String(verificationId).slice(0, 40)}`, 180, 206);
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
  const scale = Math.min(Math.max(Number(sizeScale) || 1, 0.5), 2);
  const pdfBytes = await fetch(docUrl).then((r) => r.arrayBuffer());
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const lastPage = pages[pages.length - 1];

  const stampBytes = await fetch(stampDataUrl).then((r) => r.arrayBuffer());
  const stampImg = await pdf.embedPng(stampBytes);

  if (spot && spot.page >= 1) {
    // Assigned spot: stamp centered on the exact point the creator chose.
    const page = pages[Math.min(Math.max(Math.round(spot.page), 1), pages.length) - 1];
    const { width, height } = page.getSize();
    const sw = Math.min(130, width * 0.24) * scale;
    const sh = sw * (230 / 360);
    const cx = (Number(spot.x) / 100) * width;
    const cy = height - (Number(spot.y) / 100) * height;
    const x = Math.min(Math.max(cx - sw / 2, 4), width - sw - 4);
    const y = Math.min(Math.max(cy - sh / 2, 4), height - sh - 4);
    page.drawImage(stampImg, { x, y, width: sw, height: sh });
  } else {
    // Fallback: signatures line up in rows along the bottom of the last page.
    const { width } = lastPage.getSize();
    const sw = Math.min(130, width * 0.28) * scale;
    const sh = sw * (230 / 360);
    const perRow = Math.max(1, Math.floor((width - 32) / (sw + 12)));
    const col = slotIndex % perRow;
    const row = Math.floor(slotIndex / perRow);
    lastPage.drawImage(stampImg, { x: 16 + col * (sw + 12), y: Math.max(16, 28 + row * (sh + 12)), width: sw, height: sh });
  }

  if (badge) {
    const { width, height } = lastPage.getSize();
    const badgeCanvas = makeVerificationBadgeCanvas(badge.sigId, badge.name, badge.qr);
    const badgeBlob = await new Promise((r) => badgeCanvas.toBlob(r, "image/png"));
    const badgeImg = await pdf.embedPng(await badgeBlob.arrayBuffer());
    const bw = Math.min(220, width * 0.38);
    const bh = bw * (badgeCanvas.height / badgeCanvas.width);
    lastPage.drawImage(badgeImg, { x: width - bw - 20, y: height - bh - 20, width: bw, height: bh });
  }

  const out = await pdf.save();
  if (!uploadResult) return { url: null, bytes: out };
  const file = new File([out], "signed-document.pdf", { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return { url: file_url, bytes: out };
}