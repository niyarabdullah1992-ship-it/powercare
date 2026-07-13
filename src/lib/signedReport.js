import { base44 } from "@/api/base44Client";
import { makeVerificationBadgeCanvas, generateVerificationId, loadBadgeQr } from "@/lib/verificationBadge";
import { imageBlobToPdf } from "@/lib/signPdf";
import { sha256HexOfBuffer } from "@/lib/fileHash";

// Draws the report DIRECTLY on canvas (title + table + signature + verification
// badge) — fully deterministic, full Arabic/RTL support, no HTML rendering step
// that could silently fail. The badge and signature are part of the file pixels.

function clip(ctx, text, maxW) {
  let s = String(text ?? "");
  if (ctx.measureText(s).width <= maxW) return s;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawReportCanvas({ title, companyName, dir, headers, rows }) {
  const W = 1400;
  const rowH = 38;
  const tableTop = 150;
  const footerSpace = 320; // reserved for signature + badge
  const H = tableTop + (rows.length + 1) * rowH + footerSpace;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const rtl = dir === "rtl";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  const xTitle = rtl ? W - 48 : 48;

  // Header
  ctx.fillStyle = "#3a2e22";
  ctx.font = "600 34px Tahoma, Arial, sans-serif";
  ctx.fillText(title, xTitle, 62);
  ctx.fillStyle = "#8a7660";
  ctx.font = "18px Tahoma, Arial, sans-serif";
  ctx.fillText(`${companyName} — ${new Date().toLocaleDateString(rtl ? "ar" : "en-GB")}`, xTitle, 96);
  ctx.strokeStyle = "#b07d3f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(48, 114);
  ctx.lineTo(W - 48, 114);
  ctx.stroke();

  // Table
  const colW = (W - 96) / headers.length;
  const cellX = (i) => (rtl ? W - 48 - i * colW - 10 : 48 + i * colW + 10);

  ctx.fillStyle = "rgba(176,125,63,0.14)";
  ctx.fillRect(48, tableTop - 26, W - 96, rowH);
  ctx.fillStyle = "#55483a";
  ctx.font = "600 16px Tahoma, Arial, sans-serif";
  headers.forEach((h, i) => ctx.fillText(clip(ctx, h, colW - 20), cellX(i), tableTop));

  ctx.font = "15px Tahoma, Arial, sans-serif";
  rows.forEach((r, ri) => {
    const y = tableTop + (ri + 1) * rowH;
    if (ri % 2) {
      ctx.fillStyle = "rgba(176,125,63,0.05)";
      ctx.fillRect(48, y - 26, W - 96, rowH);
    }
    ctx.fillStyle = "#3a2e22";
    r.forEach((c, ci) => ctx.fillText(clip(ctx, c, colW - 20), cellX(ci), y));
    ctx.strokeStyle = "rgba(176,125,63,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, y + 11);
    ctx.lineTo(W - 48, y + 11);
    ctx.stroke();
  });

  return canvas;
}

export async function generateSignedReport({ title, companyName, dir, headers, rows, signerName, signerId, companyId, signatureUrl }) {
  const canvas = drawReportCanvas({ title, companyName, dir, headers, rows });
  const ctx = canvas.getContext("2d");

  // Stamp the handwritten signature + verification badge in the bottom corner.
  const sigId = generateVerificationId();
  const [qr, sigImg] = await Promise.all([loadBadgeQr(sigId), loadImage(signatureUrl)]);
  const badge = makeVerificationBadgeCanvas(sigId, signerName, qr);
  const bw = 520;
  const bh = bw * (badge.height / badge.width);
  const bx = canvas.width - bw - 48;
  const by = canvas.height - bh - 40;
  if (sigImg) {
    const sw = bw * 0.5;
    const sh = sw * (sigImg.height / sigImg.width);
    ctx.drawImage(sigImg, bx + (bw - sw) / 2, Math.max(by - sh - 6, 0), sw, sh);
  }
  ctx.drawImage(badge, bx, by, bw, bh);

  // Wrap into a PDF, fingerprint it and register in the verification registry.
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Report image too large to sign");
  const { bytes } = await imageBlobToPdf(blob);
  const fileHash = await sha256HexOfBuffer(bytes);
  await base44.functions.invoke("signedDocs", {
    action: "register",
    verificationId: sigId,
    fileHash,
    signerName,
    signerId,
    companyId,
    fileName: `${title}.pdf`,
  });

  // Download the signed PDF locally.
  const dl = new Blob([bytes], { type: "application/pdf" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(dl);
  a.download = `${title.replace(/[\\/:*?"<>|]/g, "_")}-signed.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);

  return { verificationId: sigId };
}