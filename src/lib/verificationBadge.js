import drawHeritageFingerprint from "@/lib/drawHeritageFingerprint";

// Draws the "Encrypted verification ID" badge (fingerprint icon + framed ID +
// signer name & date + QR code) onto a canvas — so it can be stamped into PDFs
// and images. Canvas text supports Arabic names.
// The QR encodes the verification ID; the file's SHA-256 hash is registered in
// the platform's verification registry, so a badge copied onto another file
// will always fail verification (hash mismatch).
export function makeVerificationBadgeCanvas(sigId, signerName, qrImg, signatureImg = null) {
  const scale = 2;
  const W = 560, H = signatureImg ? 170 : signerName ? 128 : 96;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Rounded card
  const r = 14;
  ctx.beginPath();
  ctx.moveTo(r, 1);
  ctx.arcTo(W - 1, 1, W - 1, H - 1, r);
  ctx.arcTo(W - 1, H - 1, 1, H - 1, r);
  ctx.arcTo(1, H - 1, 1, 1, r);
  ctx.arcTo(1, 1, W - 1, 1, r);
  ctx.closePath();
  ctx.fillStyle = "#13283d";
  ctx.fill();
  ctx.strokeStyle = "#C7AD76";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 9);
  ctx.strokeStyle = "#C7AD7699";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Quiet white waves add depth without competing with verification data.
  ctx.save();
  ctx.strokeStyle = "#ffffff14";
  ctx.lineWidth = 1.2;
  [48, 66, 84].forEach((y, index) => {
    ctx.beginPath();
    ctx.moveTo(102, y);
    ctx.bezierCurveTo(190, y - 18 - index * 2, 310, y + 18, 438, y - 4);
    ctx.stroke();
  });
  ctx.restore();

  // Symmetrical heritage fingerprint inset safely from both frame lines.
  drawHeritageFingerprint(ctx, 50, H / 2, signatureImg ? 66 : signerName ? 62 : 54);

  if (signatureImg) {
    const maxWidth = 300, maxHeight = 62;
    const ratio = Math.min(maxWidth / signatureImg.width, maxHeight / signatureImg.height);
    const width = signatureImg.width * ratio, height = signatureImg.height * ratio;
    ctx.drawImage(signatureImg, 116 + (maxWidth - width) / 2, 14 + (maxHeight - height) / 2, width, height);
  }

  // QR code box on the right side of the card
  const q = signatureImg ? 108 : H - 20;
  const qx = W - q - 12, qy = signatureImg ? 31 : 10;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qx, qy, q, q);
  ctx.strokeStyle = "#B9975E";
  ctx.lineWidth = 2;
  ctx.strokeRect(qx, qy, q, q);
  ctx.strokeStyle = "#B9975E70";
  ctx.lineWidth = 1;
  ctx.strokeRect(qx + 4, qy + 4, q - 8, q - 8);
  if (qrImg) {
    const qrSize = q - 6;
    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = qrSize;
    qrCanvas.height = qrSize;
    const qrCtx = qrCanvas.getContext("2d", { willReadFrequently: true });
    qrCtx.drawImage(qrImg, 0, 0, qrSize, qrSize);
    const pixels = qrCtx.getImageData(0, 0, qrSize, qrSize);
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (pixels.data[i] < 150 && pixels.data[i + 1] < 150 && pixels.data[i + 2] < 150) {
        pixels.data[i] = 185;
        pixels.data[i + 1] = 151;
        pixels.data[i + 2] = 94;
      }
    }
    qrCtx.putImageData(pixels, 0, 0);
    ctx.drawImage(qrCanvas, qx + 3, qy + 3);
  } else {
    ctx.fillStyle = "#9E7C47";
    ctx.font = "600 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR", qx + q / 2, qy + q / 2 + 4);
    ctx.textAlign = "left";
  }

  // Texts — aligned on a dedicated column with clear space from the fingerprint.
  const tx = 116;
  ctx.textAlign = "left";
  ctx.fillStyle = "#f4eee2";
  ctx.font = "500 13px sans-serif";
  ctx.fillText("Encrypted verification ID", tx, signatureImg ? 94 : signerName ? 30 : 32);
  ctx.strokeStyle = "#B9975E";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tx, signatureImg ? 104 : signerName ? 40 : 42);
  ctx.lineTo(tx + 96, signatureImg ? 104 : signerName ? 40 : 42);
  ctx.stroke();
  ctx.fillStyle = "#B9975E";
  ctx.font = "600 19px 'Courier New', monospace";
  ctx.fillText(sigId || "", tx, signatureImg ? 127 : signerName ? 65 : 70);
  if (signerName) {
    ctx.fillStyle = "#C7AD76";
    ctx.font = "600 17px sans-serif";
    ctx.direction = "ltr";
    ctx.fillText(`${signerName}  —  ${new Date().toLocaleDateString("en-GB")}`, tx, signatureImg ? 154 : 101);
  }
  return canvas;
}

// A fresh, cryptographically random verification ID — unique per signing,
// so no two signed documents ever share the same number.
export function generateVerificationId() {
  const b = crypto.getRandomValues(new Uint8Array(6));
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0").toUpperCase()).join("");
  return `PWC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// Public verification URL for a signed document — scanning the badge QR opens
// this page, which shows the signature details and lets anyone upload the file
// to compare its SHA-256 hash against the registry.
export function verificationUrlFor(sigId) {
  return `${window.location.origin}/verify?id=${encodeURIComponent(sigId)}`;
}

// Loads a QR image encoding the verification URL (best-effort — badge still
// renders without it if the QR service is unreachable).
export async function loadBadgeQr(sigId) {
  try {
    const res = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=1&data=${encodeURIComponent(verificationUrlFor(sigId))}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch {
    return null;
  }
}

// PNG bytes for embedding into a PDF via pdf-lib (includes the QR code).
export async function makeVerificationBadgePng(sigId, signerName) {
  const qr = await loadBadgeQr(sigId);
  const canvas = makeVerificationBadgeCanvas(sigId, signerName, qr);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  return { bytes: await blob.arrayBuffer(), ratio: canvas.height / canvas.width };
}