/** Official NiroVera stamp — site identity: navy, green accent, paper. */

export const NAVY = "#14284B";
export const GREEN = "#1E9E63";
export const PAPER = "#FFFFFF";
export const MUTED = "#5A6B85";
export const SURFACE = "#F7F8FA";
export const GOLD = GREEN;
export const GOLD_LIGHT = "#6EE7B7";
export const OFFICIAL_STAMP_THEME = "heritage";

export const SIGNATURE_STAMP_THEMES = [
  { id: OFFICIAL_STAMP_THEME, ar: "رسمي", en: "Official" },
];

export const getSignatureThemeIcon = () => "";

export function fingerprintCode(sigId) {
  let hash = 0x811c9dc5;
  for (const ch of String(sigId || "")) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(16).toUpperCase().padStart(8, "0");
}

export function fillTracked(ctx, text, x, y, tracking = 1.4) {
  const str = String(text || "");
  if (!str) return;
  if (/[\u0600-\u06FF]/.test(str)) {
    const prevDir = ctx.direction;
    const prevAlign = ctx.textAlign;
    const shaped = `\u202B${str}\u202C`;
    ctx.direction = "rtl";
    if (prevAlign === "right") {
      ctx.textAlign = "right";
      ctx.fillText(shaped, x, y);
    } else if (prevAlign === "center") {
      ctx.textAlign = "center";
      ctx.fillText(shaped, x, y);
    } else {
      ctx.textAlign = "right";
      ctx.fillText(shaped, x + ctx.measureText(shaped).width, y);
    }
    ctx.direction = prevDir;
    ctx.textAlign = prevAlign;
    return;
  }
  const chars = [...str];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + tracking * (chars.length - 1);
  let cursor = ctx.textAlign === "right" ? x - total : ctx.textAlign === "center" ? x - total / 2 : x;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cursor, y);
    cursor += widths[i] + tracking;
  });
  ctx.textAlign = align;
}

function hexagonPath(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawScannerCorners(ctx, x, y, w, h, pad = 6, color = GREEN) {
  const len = Math.max(9, Math.min(w, h) * 0.18);
  const t = 1.35;
  const left = x - pad;
  const top = y - pad;
  const right = x + w + pad;
  const bottom = y + h + pad;
  ctx.strokeStyle = color;
  ctx.lineWidth = t;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  [
    [left, top + len, left, top, left + len, top],
    [right - len, top, right, top, right, top + len],
    [left, bottom - len, left, bottom, left + len, bottom],
    [right - len, bottom, right, bottom, right, bottom - len],
  ].forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  });
}

function drawBrandFingerprintIcon(ctx, x, y, s) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = NAVY;
  const ridges = [
    { rx: 0.10, ry: 0.13, w: 0.022, a0: 0.85, a1: 2.15 },
    { rx: 0.15, ry: 0.19, w: 0.020, a0: 0.78, a1: 2.22 },
    { rx: 0.20, ry: 0.25, w: 0.019, a0: 0.72, a1: 2.28 },
    { rx: 0.25, ry: 0.31, w: 0.018, a0: 0.70, a1: 1.18, split: 1.48 },
    { rx: 0.30, ry: 0.36, w: 0.017, a0: 0.68, a1: 2.32 },
    { rx: 0.345, ry: 0.41, w: 0.016, a0: 0.66, a1: 2.34 },
  ];
  ridges.forEach((ridge, index) => {
    ctx.strokeStyle = index % 3 === 0 ? GREEN : NAVY;
    ctx.lineWidth = Math.max(1.05, s * ridge.w);
    if (ridge.split) {
      ctx.beginPath();
      ctx.ellipse(x, y + s * 0.04, s * ridge.rx, s * ridge.ry, 0, Math.PI * ridge.a0, Math.PI * ridge.a1);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, y + s * 0.04, s * ridge.rx, s * ridge.ry, 0, Math.PI * ridge.split, Math.PI * 2.32);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y + s * 0.04, s * ridge.rx, s * ridge.ry, 0, Math.PI * ridge.a0, Math.PI * ridge.a1);
      ctx.stroke();
    }
  });
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = Math.max(1.2, s * 0.022);
  ctx.beginPath();
  ctx.ellipse(x - s * 0.02, y - s * 0.01, s * 0.055, s * 0.07, -0.4, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawOfficialMark(ctx, x, y, size, sigId = "") {
  drawEncryptedFingerprint(ctx, x, y, size, sigId);
}

/** Navy/green fingerprint in a hex scanner — site identity, not a biometric capture. */
export function drawEncryptedFingerprint(ctx, x, y, size) {
  const s = size;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const box = s * 0.92;
  drawScannerCorners(ctx, x - box / 2, y - box / 2, box, box, s * 0.06, GREEN);

  hexagonPath(ctx, x, y, s * 0.40);
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = Math.max(1.2, s * 0.02);
  ctx.stroke();
  hexagonPath(ctx, x, y, s * 0.34);
  ctx.lineWidth = Math.max(0.85, s * 0.013);
  ctx.strokeStyle = GREEN;
  ctx.stroke();

  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    const x1 = x + Math.cos(angle) * s * 0.40;
    const y1 = y + Math.sin(angle) * s * 0.40;
    const x2 = x + Math.cos(angle) * s * 0.48;
    const y2 = y + Math.sin(angle) * s * 0.48;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = Math.max(0.9, s * 0.014);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x2, y2, Math.max(1.2, s * 0.022), 0, Math.PI * 2);
    ctx.fillStyle = GREEN;
    ctx.fill();
  }

  drawBrandFingerprintIcon(ctx, x, y, s * 0.78);
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawStampThemeFrame(ctx, width, height) {
  roundedRect(ctx, 1, 1, width - 2, height - 2, 8);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 1.75;
  ctx.stroke();
}

export function drawBrandSealFrame(ctx, width, height) {
  roundedRect(ctx, 0.5, 0.5, width - 1, height - 1, 10);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  roundedRect(ctx, 6, 6, width - 12, height - 12, 7);
  ctx.strokeStyle = "rgba(30, 158, 99, 0.4)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

export const drawDocuSignFrame = drawBrandSealFrame;
