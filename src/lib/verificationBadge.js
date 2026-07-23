import drawHeritageFingerprint from "@/lib/drawHeritageFingerprint";

// Draws the "Encrypted verification ID" badge (fingerprint icon + framed ID +
// signer name & date + QR code) onto a canvas — so it can be stamped into PDFs
// and images. Canvas text supports Arabic names.
// The QR encodes the verification ID; the file's SHA-256 hash is registered in
// the platform's verification registry, so a badge copied onto another file
// will always fail verification (hash mismatch).
export function makeVerificationBadgeCanvas(sigId, signerName, qrImg, signatureImg = null, variant = "unique") {
  const scale = 2;
  const typedLayout = Boolean(signatureImg && variant === "typed");
  const W = signatureImg ? (typedLayout ? 560 : 640) : 560;
  const H = signatureImg ? (typedLayout ? 170 : 210) : signerName ? 128 : 96;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.beginPath();
  ctx.roundRect(1, 1, W - 2, H - 2, 15);
  ctx.fillStyle = "#13283d";
  ctx.fill();
  ctx.strokeStyle = "#C7AD76";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 9);
  ctx.strokeStyle = "#C7AD7680";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (signatureImg && typedLayout) {
    drawHeritageFingerprint(ctx, 50, H / 2, 66);
    const tx = 116;
    ctx.textAlign = "left";
    ctx.fillStyle = "#F4EEE2";
    ctx.font = "500 13px sans-serif";
    ctx.fillText("Encrypted verification ID", tx, 28);
    ctx.strokeStyle = "#C7AD76";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tx, 38); ctx.lineTo(tx + 96, 38); ctx.stroke();

    const maxWidth = 300, maxHeight = 54;
    const ratio = Math.min(maxWidth / signatureImg.width, maxHeight / signatureImg.height);
    const width = signatureImg.width * ratio, height = signatureImg.height * ratio;
    ctx.drawImage(signatureImg, tx + (maxWidth - width) / 2, 47 + (maxHeight - height) / 2, width, height);

    ctx.fillStyle = "#C7AD76";
    ctx.font = "600 16px 'Courier New', monospace";
    ctx.fillText(sigId || "PENDING", tx, 122);
    ctx.font = "600 17px sans-serif";
    ctx.fillText(`${signerName || ""}  —  ${new Date().toLocaleDateString("en-GB")}`, tx, 153);
  } else if (signatureImg) {
    ctx.strokeStyle = "#C7AD7638";
    ctx.beginPath();
    ctx.moveTo(112, 18); ctx.lineTo(112, H - 18);
    ctx.moveTo(492, 18); ctx.lineTo(492, H - 18);
    ctx.stroke();
    drawHeritageFingerprint(ctx, 58, H / 2, 76);

    const tx = 132;
    ctx.textAlign = "left";
    ctx.fillStyle = "#F4EEE2";
    ctx.font = "500 12px sans-serif";
    ctx.fillText("ENCRYPTED VERIFICATION ID", tx, 29);
    ctx.strokeStyle = "#C7AD7660";
    ctx.beginPath(); ctx.moveTo(tx, 39); ctx.lineTo(470, 39); ctx.stroke();

    const maxWidth = 338, maxHeight = 76;
    const ratio = Math.min(maxWidth / signatureImg.width, maxHeight / signatureImg.height);
    const width = signatureImg.width * ratio, height = signatureImg.height * ratio;
    ctx.drawImage(signatureImg, tx + (maxWidth - width) / 2, 48 + (maxHeight - height) / 2, width, height);

    ctx.fillStyle = "#C7AD76";
    ctx.font = "600 15px 'Courier New', monospace";
    ctx.fillText(sigId || "PENDING", tx, 143);
    ctx.strokeStyle = "#C7AD7638";
    ctx.beginPath(); ctx.moveTo(tx, 157); ctx.lineTo(470, 157); ctx.stroke();
    ctx.font = "600 16px sans-serif";
    ctx.fillText(`${signerName || ""}  —  ${new Date().toLocaleDateString("en-GB")}`, tx, 183);
  } else {
    drawHeritageFingerprint(ctx, 50, H / 2, signerName ? 62 : 54);
    ctx.textAlign = "left";
    ctx.fillStyle = "#F4EEE2";
    ctx.font = "500 13px sans-serif";
    ctx.fillText("Encrypted verification ID", 116, signerName ? 30 : 32);
    ctx.fillStyle = "#C7AD76";
    ctx.font = "600 19px 'Courier New', monospace";
    ctx.fillText(sigId || "", 116, signerName ? 65 : 70);
    if (signerName) {
      ctx.font = "600 17px sans-serif";
      ctx.fillText(`${signerName}  —  ${new Date().toLocaleDateString("en-GB")}`, 116, 101);
    }
  }

  const q = signatureImg ? (typedLayout ? 108 : 116) : H - 20;
  const qx = W - q - (typedLayout ? 12 : 16);
  const qy = signatureImg ? (typedLayout ? 31 : 47) : 10;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(qx, qy, q, q);
  ctx.strokeStyle = "#C7AD76";
  ctx.lineWidth = 2;
  ctx.strokeRect(qx, qy, q, q);
  ctx.strokeStyle = "#C7AD7660";
  ctx.lineWidth = 1;
  ctx.strokeRect(qx + 5, qy + 5, q - 10, q - 10);
  if (qrImg) {
    const qrSize = q - 8;
    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = qrSize;
    qrCanvas.height = qrSize;
    const qrCtx = qrCanvas.getContext("2d", { willReadFrequently: true });
    qrCtx.drawImage(qrImg, 0, 0, qrSize, qrSize);
    const pixels = qrCtx.getImageData(0, 0, qrSize, qrSize);
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (pixels.data[i] < 150 && pixels.data[i + 1] < 150 && pixels.data[i + 2] < 150) {
        pixels.data[i] = 185; pixels.data[i + 1] = 151; pixels.data[i + 2] = 94;
      }
    }
    qrCtx.putImageData(pixels, 0, 0);
    ctx.drawImage(qrCanvas, qx + 4, qy + 4);
  } else {
    ctx.fillStyle = "#9E7C47";
    ctx.font = "600 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR", qx + q / 2, qy + q / 2 + 4);
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