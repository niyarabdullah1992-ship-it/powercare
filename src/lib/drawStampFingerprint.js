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
  ctx.save(); clipFingerprint(ctx, cx, cy, size);
  drawRidges(ctx, cx, cy, size, 11, -.06, false);
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.2, size * .022);
  for (let turn = 0; turn < 4; turn += 1) {
    ctx.beginPath();
    ctx.ellipse(cx + size * .035, cy + size * .035, size * (.06 + turn * .045), size * (.08 + turn * .055), -.14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMinimal(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  for (let ridge = 0; ridge < 11; ridge += 1) {
    const offset = ridge * size * .035;
    ctx.beginPath();
    ctx.moveTo(cx + size * .45, cy - size * .46 + offset * .3);
    ctx.bezierCurveTo(cx - size * .1 + offset, cy - size * .55 + offset, cx - size * .42 + offset * .25, cy + size * .03, cx - size * .25 + offset * .35, cy + size * .5);
    ctx.strokeStyle = ridge % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .015); ctx.stroke();
  }
  ctx.restore();
}

function drawCertificate(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  for (let ridge = 0; ridge < 12; ridge += 1) {
    const height = size * (.12 + ridge * .043);
    ctx.beginPath(); ctx.moveTo(cx - size * .48, cy + size * .44 - ridge * size * .025);
    ctx.quadraticCurveTo(cx, cy + size * .38 - height * 1.7, cx + size * .48, cy + size * .44 - ridge * size * .025);
    ctx.strokeStyle = ridge % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .015); ctx.stroke();
  }
  ctx.restore();
}

function drawVault(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  for (let ridge = 0; ridge < 9; ridge += 1) {
    const rx = size * (.08 + ridge * .035); const ry = size * (.13 + ridge * .046);
    ctx.strokeStyle = ridge % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .015);
    ctx.beginPath(); ctx.ellipse(cx - size * .13, cy, rx, ry, -.25, Math.PI * .25, Math.PI * 1.82); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + size * .13, cy, rx, ry, .25, Math.PI * 1.18, Math.PI * 2.75); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(cx - size * .43, cy + size * .46); ctx.bezierCurveTo(cx - size * .18, cy + size * .15, cx + size * .18, cy - size * .15, cx + size * .43, cy - size * .46); ctx.strokeStyle = GOLD; ctx.stroke();
  ctx.restore();
}

function drawHorizon(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  for (let ridge = 0; ridge < 11; ridge += 1) {
    const inset = ridge * size * .022;
    ctx.beginPath(); ctx.moveTo(cx - size * .48 + inset, cy + size * .43 - inset);
    ctx.lineTo(cx, cy - size * (.5 - ridge * .035));
    ctx.lineTo(cx + size * .48 - inset, cy + size * .43 - inset);
    ctx.strokeStyle = ridge % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .015); ctx.stroke();
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