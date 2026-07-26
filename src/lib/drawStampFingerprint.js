import drawHeritageFingerprint from "@/lib/drawHeritageFingerprint";

const GOLD = "#C7AD76";
const GOLD_LIGHT = "#E2D1A7";

function clipFingerprint(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * .47, size * .61, 0, 0, Math.PI * 2);
  ctx.clip();
}

function drawRidges(ctx, cx, cy, size, count, rotation = 0, broken = false) {
  ctx.lineCap = "round";
  for (let index = 0; index < count; index += 1) {
    const inset = index / count;
    const rx = size * (.44 - inset * .34);
    const ry = size * (.57 - inset * .43);
    ctx.beginPath();
    if (broken) {
      ctx.ellipse(cx, cy + size * .03, rx, ry, rotation, Math.PI * .17, Math.PI * .86);
      ctx.ellipse(cx, cy + size * .03, rx, ry, rotation, Math.PI * 1.13, Math.PI * 1.82);
    } else ctx.ellipse(cx, cy + size * .03, rx, ry, rotation, 0, Math.PI * 2);
    ctx.strokeStyle = index % 2 ? GOLD : GOLD_LIGHT;
    ctx.lineWidth = Math.max(.8, size * .015);
    ctx.stroke();
  }
}

function drawExecutive(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); drawRidges(ctx, cx, cy, size, 8, -.08, true);
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.5, size * .026);
  ctx.beginPath(); ctx.moveTo(cx - size * .2, cy + size * .12); ctx.lineTo(cx, cy - size * .13); ctx.lineTo(cx + size * .2, cy + size * .12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - size * .14, cy + size * .22); ctx.lineTo(cx, cy + size * .05); ctx.lineTo(cx + size * .14, cy + size * .22); ctx.stroke();
  ctx.restore();
}

function drawMinimal(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); drawRidges(ctx, cx, cy, size, 6, 0, true);
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx, cy, size * .055, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(1, size * .018);
  ctx.beginPath(); ctx.moveTo(cx, cy - size * .18); ctx.lineTo(cx, cy + size * .27); ctx.stroke();
  ctx.restore();
}

function drawCertificate(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); drawRidges(ctx, cx, cy, size, 9, .08, false);
  ctx.fillStyle = "#13283d"; ctx.beginPath(); ctx.moveTo(cx, cy - size * .22); ctx.lineTo(cx + size * .18, cy - size * .12); ctx.lineTo(cx + size * .13, cy + size * .18); ctx.lineTo(cx, cy + size * .29); ctx.lineTo(cx - size * .13, cy + size * .18); ctx.lineTo(cx - size * .18, cy - size * .12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.5, size * .028); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - size * .09, cy + size * .02); ctx.lineTo(cx - size * .02, cy + size * .1); ctx.lineTo(cx + size * .11, cy - size * .08); ctx.stroke();
  ctx.restore();
}

function drawVault(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); drawRidges(ctx, cx, cy, size, 10, 0, true);
  ctx.fillStyle = "#13283d"; ctx.fillRect(cx - size * .16, cy - size * .02, size * .32, size * .28);
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.5, size * .025); ctx.strokeRect(cx - size * .16, cy - size * .02, size * .32, size * .28);
  ctx.beginPath(); ctx.arc(cx, cy - size * .03, size * .12, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx, cy + size * .09, size * .035, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(cx - size * .015, cy + size * .09, size * .03, size * .08);
  ctx.restore();
}

function drawHorizon(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); drawRidges(ctx, cx, cy, size, 7, 0, false);
  ctx.fillStyle = "#13283d"; ctx.fillRect(cx - size * .5, cy - size * .12, size, size * .28);
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.2, size * .022);
  for (let wave = 0; wave < 3; wave += 1) {
    const y = cy - size * .07 + wave * size * .09;
    ctx.beginPath(); ctx.moveTo(cx - size * .45, y); ctx.bezierCurveTo(cx - size * .23, y - size * .11, cx - size * .08, y + size * .11, cx + size * .1, y); ctx.bezierCurveTo(cx + size * .25, y - size * .1, cx + size * .36, y + size * .07, cx + size * .47, y); ctx.stroke();
  }
  ctx.restore();
}

export default function drawStampFingerprint(ctx, cx, cy, size, theme = "heritage") {
  if (theme === "executive") return drawExecutive(ctx, cx, cy, size);
  if (theme === "minimal") return drawMinimal(ctx, cx, cy, size);
  if (theme === "certificate") return drawCertificate(ctx, cx, cy, size);
  if (theme === "vault") return drawVault(ctx, cx, cy, size);
  if (theme === "horizon") return drawHorizon(ctx, cx, cy, size);
  return drawHeritageFingerprint(ctx, cx, cy, size);
}