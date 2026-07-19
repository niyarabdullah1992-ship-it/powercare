import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { base44 } from "@/api/base44Client";
import { loadBadgeQr, makeVerificationBadgeCanvas } from "@/lib/verificationBadge";
import { STAMP_FALLBACK_SPOT, STAMP_WIDTH_PERCENT, clampStampScale } from "@/lib/signatureStampGeometry";
import { drawTextField } from "@/lib/signPdf";

// Builds the one canonical stamp image used by the web preview and the PDF.
export async function makeSignatureStamp(_sigDataUrl, name, verificationId = "") {
  const qr = verificationId ? await loadBadgeQr(verificationId) : null;
  return makeVerificationBadgeCanvas(verificationId, name, qr).toDataURL("image/png");
}

// Stamps one signer's composed stamp onto the PDF. When `spot` is provided
// ({ page, x, y } — creator-assigned position, in % from the page's top-left),
// the signature is stamped ONLY there; otherwise it falls back to the shared
// slot rows along the bottom of the last page. When `badge` is provided (last
// signer), the verification badge is stamped at the top-right of the last
// page too. Uploads and returns { url, bytes }.
export async function stampOnPdf(docUrl, stampDataUrl, slotIndex, badge, spot, sizeScale = 1, uploadResult = true, fields = null, textValues = {}) {
  const scale = clampStampScale((Number(sizeScale) || 1) * 100) / 100;
  const pdfBytes = await fetch(docUrl).then((r) => r.arrayBuffer());
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const lastPage = pages[pages.length - 1];

  const stampBytes = await fetch(stampDataUrl).then((r) => r.arrayBuffer());
  const stampImg = await pdf.embedPng(stampBytes);

  const assignedFields = Array.isArray(fields) && fields.length ? fields : [{ ...(spot?.page >= 1 ? spot : { ...STAMP_FALLBACK_SPOT, page: pages.length }), id: "signature", type: "signature", scale: scale * 100 }];
  for (const field of assignedFields) {
    const page = pages[Math.min(Math.max(Math.round(field.page || 1), 1), pages.length) - 1];
    if (field.type === "text") { await drawTextField(pdf, page, field, textValues[field.id]); continue; }
    const { width, height } = page.getSize();
    const fieldScale = clampStampScale(Number(field.scale) || scale * 100) / 100;
    const sw = width * (STAMP_WIDTH_PERCENT / 100) * fieldScale;
    const sh = sw * (stampImg.height / stampImg.width);
    const cx = (Number(field.x) / 100) * width;
    const cy = height - (Number(field.y) / 100) * height;
    page.drawImage(stampImg, { x: cx - sw / 2, y: cy - sh / 2, width: sw, height: sh });
  }

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