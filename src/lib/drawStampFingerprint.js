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
  for (let ridge = 0; ridge < 9; ridge += 1) {
    const offset = ridge * size * .038;
    ctx.beginPath(); ctx.moveTo(cx + size * .46, cy - size * .45 + offset * .25);
    ctx.bezierCurveTo(cx - size * .08 + offset, cy - size * .55 + offset, cx - size * .43 + offset * .22, cy + size * .02, cx - size * .24 + offset * .32, cy + size * .51);
    ctx.strokeStyle = ridge % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .015); ctx.stroke();
  }
  const nodes = [[-.27,-.26],[-.13,-.05],[-.22,.2],[.02,.28],[.18,.08],[.29,-.18]];
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1, size * .018); ctx.beginPath();
  nodes.forEach(([x,y], index) => { const px = cx + x * size, py = cy + y * size; if (!index) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.stroke();
  nodes.forEach(([x,y]) => { ctx.fillStyle = "#13283d"; ctx.beginPath(); ctx.arc(cx + x * size, cy + y * size, size * .035, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = GOLD_LIGHT; ctx.stroke(); });
  ctx.restore();
}

function drawCertificate(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  for (let band = 0; band < 8; band += 1) {
    const y = cy - size * .43 + band * size * .12;
    ctx.beginPath(); ctx.moveTo(cx - size * .44, y); ctx.bezierCurveTo(cx - size * .2, y - size * .1, cx + size * .2, y + size * .1, cx + size * .44, y);
    ctx.strokeStyle = band % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .014); ctx.stroke();
  }
  for (let column = -3; column <= 3; column += 1) {
    const x = cx + column * size * .12; ctx.strokeStyle = "#C7AD7666"; ctx.beginPath(); ctx.moveTo(x, cy - size * .48); ctx.lineTo(x + column * size * .018, cy + size * .48); ctx.stroke();
  }
  [[-2,-2],[1,-2],[-1,0],[2,1],[-2,2],[1,3]].forEach(([gx,gy]) => { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx + gx * size * .12, cy + gy * size * .1, size * .028, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}

function drawVault(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  for (let ring = 0; ring < 10; ring += 1) {
    const radiusX = size * (.08 + ring * .037); const radiusY = size * (.1 + ring * .048);
    const phase = (ring % 3) * Math.PI * .14;
    ctx.strokeStyle = ring % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .015);
    ctx.beginPath(); ctx.ellipse(cx, cy, radiusX, radiusY, .1, phase, Math.PI * .72 + phase); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, radiusX, radiusY, .1, Math.PI + phase, Math.PI * 1.72 + phase); ctx.stroke();
  }
  for (let spoke = 0; spoke < 7; spoke += 1) {
    const angle = spoke * Math.PI * 2 / 7 - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * size * .12, y1 = cy + Math.sin(angle) * size * .15;
    const x2 = cx + Math.cos(angle) * size * .4, y2 = cy + Math.sin(angle) * size * .5;
    ctx.strokeStyle = "#C7AD7688"; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x2, y2, size * .025, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHorizon(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  for (let wave = 0; wave < 9; wave += 1) {
    const y = cy - size * .42 + wave * size * .105;
    ctx.beginPath(); ctx.moveTo(cx - size * .48, y);
    ctx.bezierCurveTo(cx - size * .3, y - size * .16, cx - size * .12, y + size * .16, cx, y);
    ctx.bezierCurveTo(cx + size * .13, y - size * .16, cx + size * .3, y + size * .16, cx + size * .48, y);
    ctx.strokeStyle = wave % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .015); ctx.stroke();
  }
  const pulse = [[-.38,.18],[-.25,.18],[-.18,-.02],[-.1,.3],[0,-.22],[.1,.12],[.2,-.1],[.29,.18],[.4,.18]];
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.4, size * .025); ctx.beginPath();
  pulse.forEach(([x,y], index) => { const px = cx + x * size, py = cy + y * size; if (!index) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.stroke();
  pulse.filter((_, index) => index % 2).forEach(([x,y]) => { ctx.fillStyle = GOLD_LIGHT; ctx.beginPath(); ctx.arc(cx + x * size, cy + y * size, size * .025, 0, Math.PI * 2); ctx.fill(); });
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