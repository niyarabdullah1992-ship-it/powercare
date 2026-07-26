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
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "square";
  for (let ring = 0; ring < 10; ring += 1) {
    const rx = size * (.07 + ring * .038), ry = size * (.09 + ring * .047);
    const gap = Math.PI * (.08 + (ring % 3) * .04);
    ctx.strokeStyle = ring % 2 ? GOLD : GOLD_LIGHT; ctx.lineWidth = Math.max(1, size * .017);
    for (let segment = 0; segment < 4; segment += 1) {
      const start = segment * Math.PI / 2 + gap;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, .08, start, start + Math.PI / 2 - gap * 1.5); ctx.stroke();
    }
  }
  for (let bit = 0; bit < 12; bit += 1) {
    const angle = bit * Math.PI * 2 / 12; const radius = size * (bit % 2 ? .34 : .43);
    const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius * 1.18;
    ctx.fillStyle = bit % 3 ? GOLD : GOLD_LIGHT; ctx.fillRect(x - size * .018, y - size * .018, size * .036, size * .036);
  }
  ctx.fillStyle = GOLD_LIGHT; ctx.beginPath(); ctx.arc(cx, cy, size * .04, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHorizon(ctx, cx, cy, size) {
  ctx.save(); clipFingerprint(ctx, cx, cy, size); ctx.lineCap = "round";
  ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = Math.max(1, size * .016);
  for (let orbit = 0; orbit < 4; orbit += 1) {
    ctx.beginPath(); ctx.ellipse(cx, cy, size * (.18 + orbit * .07), size * (.08 + orbit * .055), orbit % 2 ? -.65 : .65, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.4, size * .023);
  ctx.beginPath(); ctx.moveTo(cx, cy - size * .43); ctx.lineTo(cx + size * .22, cy); ctx.lineTo(cx, cy + size * .43); ctx.lineTo(cx - size * .22, cy); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - size * .4, cy); ctx.lineTo(cx, cy - size * .2); ctx.lineTo(cx + size * .4, cy); ctx.lineTo(cx, cy + size * .2); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = GOLD_LIGHT; ctx.beginPath(); ctx.arc(cx, cy, size * .055, 0, Math.PI * 2); ctx.fill();
  [[0,-.43],[.4,0],[0,.43],[-.4,0],[-.27,-.27],[.27,-.27],[-.27,.27],[.27,.27]].forEach(([x,y], index) => {
    ctx.fillStyle = index < 4 ? GOLD : GOLD_LIGHT; ctx.beginPath(); ctx.arc(cx + x * size, cy + y * size, size * (index < 4 ? .026 : .018), 0, Math.PI * 2); ctx.fill();
  });
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