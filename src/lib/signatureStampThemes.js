export const SIGNATURE_STAMP_THEMES = [
  { id: "heritage", ar: "المسار الرقمي", en: "Digital Trace", preview: "rounded-xl border-2 border-accent" },
  { id: "executive", ar: "الدوّامة", en: "Whorl Code", preview: "rounded-sm border-t-4 border-accent" },
  { id: "minimal", ar: "رمز القفل", en: "Lock Symbol", preview: "rounded-md border-s-4 border-accent" },
  { id: "certificate", ar: "رمز البصمة الإلكترونية", en: "E-Fingerprint", preview: "rounded-lg border-4 border-double border-accent" },
  { id: "vault", ar: "رمز المفتاح", en: "Digital Key", preview: "rounded-2xl border-2 border-accent shadow-inner" },
  { id: "horizon", ar: "الرمز الخيالي", en: "Fantasy Symbol", preview: "rounded-full border-y-4 border-accent" },
];

function baseFrame(ctx, width, height, radius = 14, fill = "#13283d", lineWidth = 2.5) {
  ctx.beginPath();
  ctx.roundRect(1, 1, width - 2, height - 2, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#C7AD76";
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function drawStampThemeFrame(ctx, width, height, theme = "heritage") {
  if (theme === "executive") {
    baseFrame(ctx, width, height, 3);
    ctx.fillStyle = "#C7AD76"; ctx.fillRect(2, 2, width - 4, 7);
    ctx.fillStyle = "#C7AD7620"; ctx.fillRect(112, 9, 380, height - 18);
    return;
  }
  if (theme === "minimal") {
    baseFrame(ctx, width, height, 7, "#182C40", 1.25);
    ctx.fillStyle = "#C7AD76"; ctx.fillRect(1, 1, 8, height - 2);
    return;
  }
  if (theme === "certificate") {
    baseFrame(ctx, width, height, 12);
    ctx.strokeStyle = "#C7AD76A0"; ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, width - 16, height - 16);
    ctx.strokeRect(12, 12, width - 24, height - 24);
    return;
  }
  if (theme === "vault") {
    baseFrame(ctx, width, height, 20, "#091827", 3);
    ctx.fillStyle = "#C7AD7615"; ctx.fillRect(12, 12, 94, height - 24);
    ctx.fillRect(120, 12, 364, height - 24);
    ctx.strokeStyle = "#C7AD7648"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(58, height / 2, 47, 0, Math.PI * 2); ctx.stroke();
    return;
  }
  if (theme === "horizon") {
    baseFrame(ctx, width, height, 28, "#10263B", 2);
    ctx.fillStyle = "#C7AD76"; ctx.fillRect(24, 7, width - 48, 3); ctx.fillRect(24, height - 10, width - 48, 3);
    ctx.strokeStyle = "#C7AD762C"; ctx.beginPath(); ctx.moveTo(102, 18); ctx.lineTo(126, height - 18); ctx.stroke();
    return;
  }
  baseFrame(ctx, width, height, 15);
  ctx.beginPath(); ctx.roundRect(8, 8, width - 16, height - 16, 9);
  ctx.strokeStyle = "#C7AD7680"; ctx.lineWidth = 1; ctx.stroke();
}