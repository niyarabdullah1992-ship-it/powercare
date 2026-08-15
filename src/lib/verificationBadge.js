import {
  drawBrandSealFrame,
  drawEncryptedFingerprint,
  drawScannerCorners,
  fillTracked,
  GREEN,
  MUTED,
  NAVY,
  PAPER,
} from "@/lib/signatureStampThemes";

const SANS = "'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif";
const MONO = "'Courier New', monospace";

async function qrToCanvas(canvas, text, options) {
  const mod = await import("qrcode");
  const toCanvas = mod.toCanvas || mod.default?.toCanvas;
  if (typeof toCanvas !== "function") return null;
  await toCanvas(canvas, text, options);
  return canvas;
}

export function generateVerificationId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const hex = Array.from(bytes, (x) => x.toString(16).padStart(2, "0").toUpperCase()).join("");
  return `PWC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export function verificationUrlFor(sigId) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/verify?id=${encodeURIComponent(sigId)}`;
}

export async function loadBadgeQr(sigId) {
  if (!sigId) return null;
  try {
    const canvas = document.createElement("canvas");
    const drawn = await qrToCanvas(canvas, verificationUrlFor(sigId), {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: NAVY, light: PAPER },
    });
    return drawn;
  } catch {
    return null;
  }
}

export function makeVerificationBadgeCanvas(sigId, signerName, qrImg) {
  const scale = 3;
  const W = 900;
  const H = 176;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const arabic =
    /[\u0600-\u06ff]/.test(signerName || "")
    || (typeof document !== "undefined" && document.documentElement.dir === "rtl");
  const id = String(sigId || "").trim();
  const dateText = new Date().toLocaleDateString("en-GB", {
    timeZone: "Asia/Riyadh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  drawBrandSealFrame(ctx, W, H);

  ctx.fillStyle = GREEN;
  ctx.fillRect(8, 18, 3, H - 36);

  drawEncryptedFingerprint(ctx, 92, H / 2, 104);

  const qrSize = 100;
  const qrX = W - 38 - qrSize;
  const qrY = (H - qrSize) / 2;
  if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  drawScannerCorners(ctx, qrX, qrY, qrSize, qrSize, 7, GREEN);

  ctx.strokeStyle = "rgba(20, 40, 75, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(qrX - 22, 28);
  ctx.lineTo(qrX - 22, H - 28);
  ctx.stroke();

  const tx = 164;
  const maxText = qrX - 44 - tx;
  const mid = H / 2;

  ctx.fillStyle = NAVY;
  ctx.font = `600 11px ${SANS}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  fillTracked(ctx, "NIROVERA", tx, mid - 38, 2);

  ctx.fillStyle = MUTED;
  ctx.font = `500 10px ${SANS}`;
  if (arabic) {
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    const caption = "\u202Bرقم التحقق المشفّر\u202C";
    ctx.fillText(caption, tx + ctx.measureText(caption).width, mid - 16, maxText);
    ctx.direction = "ltr";
    ctx.textAlign = "left";
  } else {
    fillTracked(ctx, "ENCRYPTED VERIFICATION ID", tx, mid - 16, 1.5);
  }

  ctx.fillStyle = GREEN;
  ctx.font = `700 22px ${MONO}`;
  ctx.fillText(id || "PWC-————-————-————", tx, mid + 14, maxText);

  ctx.strokeStyle = "rgba(30, 158, 99, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx, mid + 26);
  ctx.lineTo(tx + Math.min(maxText, 380), mid + 26);
  ctx.stroke();

  ctx.fillStyle = NAVY;
  ctx.font = `600 16px ${SANS}`;
  ctx.direction = arabic ? "rtl" : "ltr";
  ctx.fillText(`${signerName || ""}  ·  ${dateText}`, tx, mid + 50, maxText);
  ctx.direction = "ltr";

  return canvas;
}

export async function makeVerificationBadgePng(sigId, signerName) {
  const id = String(sigId || "").trim() || generateVerificationId();
  const qr = await loadBadgeQr(id);
  const canvas = makeVerificationBadgeCanvas(id, signerName, qr);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  return { bytes: await blob.arrayBuffer(), ratio: canvas.height / canvas.width };
}
