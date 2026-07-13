// Draws the "Encrypted verification ID" badge (fingerprint icon + framed ID +
// signer name & date + QR code) onto a canvas — so it can be stamped into PDFs
// and images. Canvas text supports Arabic names.
// The QR encodes the verification ID; the file's SHA-256 hash is registered in
// the platform's verification registry, so a badge copied onto another file
// will always fail verification (hash mismatch).
export function makeVerificationBadgeCanvas(sigId, signerName, qrImg) {
  const scale = 2;
  const W = 560, H = signerName ? 128 : 96;
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
  ctx.fillStyle = "#faf6ef";
  ctx.fill();
  ctx.strokeStyle = "#e3d9c8";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Fingerprint icon — concentric broken arcs in gold
  const cx = 42, cy = H / 2;
  ctx.strokeStyle = "#b07d3f";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  const arcs = [
    [7, 0.75, 2.05],
    [12, 0.9, 1.9],
    [12, 2.3, 3.1],
    [17, 1.05, 1.75],
    [17, 2.1, 3.35],
    [22, 1.15, 1.65],
    [22, 1.95, 3.5],
  ];
  for (const [rad, a1, a2] of arcs) {
    ctx.beginPath();
    ctx.arc(cx, cy, rad, a1 * Math.PI, a2 * Math.PI);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 2.2, 0, 2 * Math.PI);
  ctx.fillStyle = "#b07d3f";
  ctx.fill();

  // QR code box on the right side of the card
  const q = H - 20;
  const qx = W - q - 12, qy = 10;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qx, qy, q, q);
  ctx.strokeStyle = "#e3d9c8";
  ctx.lineWidth = 1;
  ctx.strokeRect(qx, qy, q, q);
  if (qrImg) {
    ctx.drawImage(qrImg, qx + 3, qy + 3, q - 6, q - 6);
  } else {
    ctx.fillStyle = "#c9bda6";
    ctx.font = "600 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR", qx + q / 2, qy + q / 2 + 4);
    ctx.textAlign = "left";
  }

  // Texts
  const tx = 82;
  ctx.fillStyle = "#8a7d6a";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Encrypted verification ID", tx, signerName ? 34 : 36);
  ctx.fillStyle = "#2b2418";
  ctx.font = "600 21px 'Courier New', monospace";
  ctx.fillText(sigId || "", tx, signerName ? 62 : 66);
  if (signerName) {
    ctx.fillStyle = "#2b2418";
    ctx.font = "600 17px sans-serif";
    ctx.direction = "ltr";
    ctx.fillText(`${signerName} — ${new Date().toLocaleDateString("en-GB")}`, tx, 98);
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

// Loads a QR image encoding the verification ID (best-effort — badge still
// renders without it if the QR service is unreachable).
export async function loadBadgeQr(sigId) {
  try {
    const res = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=1&data=${encodeURIComponent(sigId)}`
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