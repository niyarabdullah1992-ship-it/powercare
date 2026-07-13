import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";
import { makeVerificationBadgeCanvas, generateVerificationId, loadBadgeQr } from "@/lib/verificationBadge";
import { imageBlobToPdf } from "@/lib/signPdf";
import { sha256HexOfBuffer } from "@/lib/fileHash";

// Renders a brand-styled report as HTML (full Arabic/RTL support), converts it
// to canvas, stamps the verification badge and registers the file fingerprint —
// then downloads the signed PDF. One call = report + signature + verification.
function buildReportElement({ title, companyName, dir, headers, rows }) {
  const esc = (v) => String(v ?? "");
  const el = document.createElement("div");
  el.setAttribute("dir", dir);
  el.style.cssText = "position:absolute;left:-99999px;top:0;width:1000px;background:#fff;padding:40px 40px 200px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#3a2e22;";
  el.innerHTML = `
    <div style="border-bottom:3px solid #b07d3f;padding-bottom:16px;margin-bottom:20px;">
      <h1 style="font-size:24px;margin:0;">${esc(title)}</h1>
      <p style="font-size:13px;color:#8a7660;margin:6px 0 0;">${esc(companyName)} — ${new Date().toLocaleDateString(dir === "rtl" ? "ar" : "en-GB")}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr>${headers.map((h) => `<th style="background:#b07d3f1a;text-align:start;padding:8px 9px;border-bottom:2px solid #b07d3f;color:#55483a;font-size:11.5px;">${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr>${r.map((c) => `<td style="padding:8px 9px;border-bottom:1px solid #b07d3f22;${i % 2 ? "background:#b07d3f08;" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;
  return el;
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

export async function generateSignedReport({ title, companyName, dir, headers, rows, signerName, signerId, companyId, signatureUrl }) {
  const el = buildReportElement({ title, companyName, dir, headers, rows });
  document.body.appendChild(el);
  let canvas;
  try {
    // Long reports: cap the canvas height so rendering never exceeds browser
    // canvas limits (which would silently produce an empty/unsigned file).
    const scale = Math.min(2, Math.max(1, 14000 / Math.max(el.scrollHeight, 1)));
    canvas = await html2canvas(el, { scale, backgroundColor: "#ffffff" });
  } finally {
    el.remove();
  }
  if (!canvas || !canvas.height) throw new Error("Report rendering failed");

  // Stamp the user's handwritten signature + verification badge in the bottom corner.
  const sigId = generateVerificationId();
  const [qr, sigImg] = await Promise.all([loadBadgeQr(sigId), loadImage(signatureUrl)]);
  const badge = makeVerificationBadgeCanvas(sigId, signerName, qr);
  const ctx = canvas.getContext("2d");
  const bw = Math.min(620, canvas.width * 0.38);
  const bh = bw * (badge.height / badge.width);
  const bx = canvas.width - bw - 48;
  const by = canvas.height - bh - 48;
  if (sigImg) {
    const sw = bw * 0.55;
    const sh = sw * (sigImg.height / sigImg.width);
    ctx.drawImage(sigImg, bx + (bw - sw) / 2, Math.max(by - sh - 8, 0), sw, sh);
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