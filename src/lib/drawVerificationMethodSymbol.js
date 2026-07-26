const GOLD = "#C7AD76";
const LIGHT = "#E2D1A7";

function setup(ctx) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function electronicSignature(ctx, x, y, s) {
  setup(ctx); ctx.strokeStyle = LIGHT; ctx.lineWidth = Math.max(1.4, s * .024);
  ctx.beginPath(); ctx.moveTo(x - s * .44, y + s * .2); ctx.bezierCurveTo(x - s * .3, y - s * .16, x - s * .2, y + s * .32, x - s * .03, y);
  ctx.bezierCurveTo(x + s * .08, y - s * .18, x + s * .1, y + s * .2, x + s * .22, y); ctx.bezierCurveTo(x + s * .28, y - s * .08, x + s * .32, y + s * .13, x + s * .42, y); ctx.stroke();
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(2, s * .035); ctx.beginPath(); ctx.moveTo(x + s * .12, y - s * .28); ctx.lineTo(x + s * .35, y - s * .48); ctx.lineTo(x + s * .44, y - s * .36); ctx.lineTo(x + s * .2, y - s * .16); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = "#C7AD7666"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - s * .45, y + s * .38); ctx.lineTo(x + s * .45, y + s * .38); ctx.stroke();
}

function encryptedNumbers(ctx, x, y, s) {
  setup(ctx); ctx.strokeStyle = LIGHT; ctx.lineWidth = Math.max(1.5, s * .025); ctx.beginPath(); ctx.arc(x, y - s * .17, s * .22, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.2, s * .02); ctx.beginPath(); ctx.roundRect(x - s * .32, y - s * .12, s * .64, s * .44, s * .07); ctx.stroke();
  ctx.font = `700 ${Math.max(9, s * .19)}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = LIGHT; ctx.fillText("* * *", x, y + s * .1);
}

function smartCard(ctx, x, y, s) {
  setup(ctx); ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.4, s * .023); ctx.beginPath(); ctx.roundRect(x - s * .46, y - s * .31, s * .92, s * .62, s * .09); ctx.stroke();
  ctx.strokeStyle = LIGHT; ctx.lineWidth = Math.max(1, s * .017); ctx.beginPath(); ctx.roundRect(x - s * .34, y - s * .17, s * .29, s * .34, s * .04); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - s * .34, y - s * .04); ctx.lineTo(x - s * .05, y - s * .04); ctx.moveTo(x - s * .34, y + s * .07); ctx.lineTo(x - s * .05, y + s * .07); ctx.moveTo(x - s * .19, y - s * .17); ctx.lineTo(x - s * .19, y + s * .17); ctx.stroke();
  for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(x + s * .12, y, s * (.1 + i * .07), -Math.PI * .4, Math.PI * .4); ctx.stroke(); }
}

function fingerprint(ctx, x, y, s) {
  setup(ctx); ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, s * .46, s * .58, 0, 0, Math.PI * 2); ctx.clip();
  for (let i = 0; i < 9; i += 1) { const rx = s * (.1 + i * .04); const ry = s * (.14 + i * .046); ctx.beginPath(); ctx.ellipse(x, y + s * .08, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.strokeStyle = i % 2 ? GOLD : LIGHT; ctx.lineWidth = Math.max(1, s * .016); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x, y - s * .08); ctx.quadraticCurveTo(x - s * .08, y + s * .08, x, y + s * .36); ctx.strokeStyle = LIGHT; ctx.lineWidth = Math.max(1.3, s * .022); ctx.stroke(); ctx.restore();
}

function iris(ctx, x, y, s) {
  setup(ctx); ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.5, s * .024); ctx.beginPath(); ctx.moveTo(x - s * .47, y); ctx.quadraticCurveTo(x, y - s * .47, x + s * .47, y); ctx.quadraticCurveTo(x, y + s * .47, x - s * .47, y); ctx.stroke();
  for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(x, y, s * (.07 + i * .055), 0, Math.PI * 2); ctx.strokeStyle = i % 2 ? GOLD : LIGHT; ctx.lineWidth = Math.max(1, s * .015); ctx.stroke(); }
  ctx.fillStyle = LIGHT; ctx.beginPath(); ctx.arc(x, y, s * .045, 0, Math.PI * 2); ctx.fill();
}

function password(ctx, x, y, s) {
  setup(ctx); ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.7, s * .027); ctx.beginPath(); ctx.moveTo(x, y - s * .48); ctx.lineTo(x + s * .37, y - s * .3); ctx.lineTo(x + s * .32, y + s * .18); ctx.quadraticCurveTo(x, y + s * .48, x - s * .32, y + s * .18); ctx.lineTo(x - s * .37, y - s * .3); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = LIGHT; ctx.lineWidth = Math.max(1.3, s * .021); ctx.beginPath(); ctx.arc(x, y - s * .05, s * .07, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + s * .02); ctx.lineTo(x, y + s * .2); ctx.stroke();
}

export default function drawVerificationMethodSymbol(ctx, x, y, size, theme) {
  ctx.save();
  if (theme === "executive") encryptedNumbers(ctx, x, y, size);
  else if (theme === "horizon") smartCard(ctx, x, y, size);
  else if (theme === "certificate") fingerprint(ctx, x, y, size);
  else if (theme === "vault") iris(ctx, x, y, size);
  else if (theme === "minimal") password(ctx, x, y, size);
  else electronicSignature(ctx, x, y, size);
  ctx.restore();
}