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
  ctx.font = `600 ${Math.max(7, size * .115)}px 'Courier New', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const rows = ["101101", "011010", "110011", "001101", "101010", "010111"];
  rows.forEach((digits, row) => {
    [...digits].forEach((digit, column) => {
      ctx.fillStyle = (row + column) % 3 === 0 ? GOLD_LIGHT : "#C7AD7699";
      ctx.fillText(digit, cx + (column - 2.5) * size * .115, cy + (row - 2.5) * size * .145);
    });
  });
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.2, size * .022);
  ctx.beginPath(); ctx.roundRect(cx - size * .39, cy - size * .49, size * .78, size * .98, size * .08); ctx.stroke();
  ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(1.6, size * .026);
  ctx.beginPath(); ctx.moveTo(cx - size * .46, cy - size * .18); ctx.lineTo(cx - size * .46, cy - size * .38); ctx.lineTo(cx - size * .28, cy - size * .38); ctx.moveTo(cx + size * .46, cy + size * .18); ctx.lineTo(cx + size * .46, cy + size * .38); ctx.lineTo(cx + size * .28, cy + size * .38); ctx.stroke();
  ctx.fillStyle = GOLD_LIGHT; ctx.beginPath(); ctx.arc(cx, cy, size * .045, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawMinimal(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(1.5, size * .025);
  ctx.beginPath(); ctx.arc(cx, cy - size * .12, size * .22, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1, size * .018);
  ctx.beginPath(); ctx.roundRect(cx - size * .3, cy - size * .1, size * .6, size * .48, size * .07); ctx.stroke();
  for (let ridge = 0; ridge < 6; ridge += 1) {
    const rx = size * (.045 + ridge * .028), ry = size * (.06 + ridge * .035);
    ctx.beginPath(); ctx.ellipse(cx, cy + size * .12, rx, ry, 0, Math.PI * .1, Math.PI * 1.9); ctx.strokeStyle = ridge % 2 ? GOLD : GOLD_LIGHT; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(cx, cy + size * .19); ctx.lineTo(cx, cy + size * .31); ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(2, size * .03); ctx.stroke();
  [[-.4,-.3],[.4,-.3],[-.42,.26],[.42,.26]].forEach(([x,y]) => { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx + x * size, cy + y * size, size * .025, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}

function drawCertificate(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  drawRidges(ctx, cx, cy, size, 9, -.03, false);
  const circuits = [[-.38,-.2,-.2,-.2],[-.42,.12,-.18,.12],[.18,-.3,.4,-.3],[.2,.02,.44,.02],[-.25,.34,-.42,.34],[.18,.3,.4,.3]];
  circuits.forEach(([x1,y1,x2,y2], index) => {
    ctx.strokeStyle = index % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(1, size * .017);
    ctx.beginPath(); ctx.moveTo(cx + x1 * size, cy + y1 * size); ctx.lineTo(cx + x2 * size, cy + y1 * size); ctx.lineTo(cx + x2 * size, cy + y2 * size); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx + x2 * size, cy + y2 * size, size * .027, 0, Math.PI * 2); ctx.fill();
  });
  ctx.strokeStyle = "#C7AD7666"; ctx.strokeRect(cx - size * .08, cy - size * .08, size * .16, size * .16);
  ctx.fillStyle = GOLD_LIGHT; ctx.fillRect(cx - size * .025, cy - size * .025, size * .05, size * .05);
  ctx.restore();
}

function drawVault(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(1.5, size * .025);
  ctx.beginPath(); ctx.arc(cx - size * .2, cy - size * .08, size * .2, 0, Math.PI * 2); ctx.stroke();
  for (let ridge = 0; ridge < 4; ridge += 1) {
    ctx.beginPath(); ctx.ellipse(cx - size * .2, cy - size * .08, size * (.055 + ridge * .032), size * (.07 + ridge * .035), -.25, 0, Math.PI * 2);
    ctx.strokeStyle = ridge % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(.8, size * .014); ctx.stroke();
  }
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(3, size * .055);
  ctx.beginPath(); ctx.moveTo(cx - size * .04, cy + size * .02); ctx.lineTo(cx + size * .38, cy + size * .3); ctx.stroke();
  ctx.lineWidth = Math.max(1.8, size * .032);
  ctx.beginPath(); ctx.moveTo(cx + size * .18, cy + size * .17); ctx.lineTo(cx + size * .1, cy + size * .3); ctx.moveTo(cx + size * .3, cy + size * .25); ctx.lineTo(cx + size * .22, cy + size * .39); ctx.stroke();
  ctx.strokeStyle = "#C7AD7677"; ctx.lineWidth = Math.max(.8, size * .012);
  [[-.42,-.34],[-.02,-.4],[.18,-.24],[.4,-.06],[-.4,.26]].forEach(([x,y], index) => { ctx.beginPath(); ctx.moveTo(cx + x * size, cy + y * size); ctx.lineTo(cx + (x + .08) * size, cy + y * size); ctx.stroke(); ctx.fillStyle = index % 2 ? GOLD : GOLD_LIGHT; ctx.fillRect(cx + (x + .09) * size, cy + y * size - size * .015, size * .03, size * .03); });
  ctx.restore();
}

function drawHorizon(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.8, size * .028);
  ctx.beginPath(); ctx.roundRect(cx - size * .43, cy - size * .34, size * .86, size * .68, size * .09); ctx.stroke();
  ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(1.2, size * .02);
  ctx.beginPath(); ctx.roundRect(cx - size * .27, cy - size * .2, size * .34, size * .4, size * .045); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - size * .27, cy - size * .06); ctx.lineTo(cx + size * .07, cy - size * .06); ctx.moveTo(cx - size * .27, cy + size * .07); ctx.lineTo(cx + size * .07, cy + size * .07); ctx.moveTo(cx - size * .11, cy - size * .2); ctx.lineTo(cx - size * .11, cy + size * .2); ctx.stroke();
  ctx.fillStyle = GOLD; [[-.36,-.23],[-.36,.23],[.36,-.23],[.36,.23]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(cx + x * size, cy + y * size, size * .024, 0, Math.PI * 2); ctx.fill(); });
  ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(1.5, size * .024);
  for (let wave = 0; wave < 3; wave += 1) {
    ctx.beginPath(); ctx.arc(cx + size * .12, cy, size * (.11 + wave * .075), -Math.PI * .38, Math.PI * .38); ctx.stroke();
  }
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx + size * .12, cy, size * .035, 0, Math.PI * 2); ctx.fill();
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