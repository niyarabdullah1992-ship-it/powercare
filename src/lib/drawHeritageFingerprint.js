export default function drawHeritageFingerprint(ctx, cx, cy, size) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.ellipse(cx, cy, size * .47, size * .62, 0, 0, Math.PI * 2);
  ctx.clip();

  const ridgeGradient = ctx.createLinearGradient(cx - size * .45, cy - size * .55, cx + size * .45, cy + size * .55);
  ridgeGradient.addColorStop(0, "#E2D1A7");
  ridgeGradient.addColorStop(.5, "#C7AD76");
  ridgeGradient.addColorStop(1, "#9E7C47");

  const turns = Math.PI * 19;
  const steps = 520;
  ctx.beginPath();
  for (let index = 0; index <= steps; index += 1) {
    const theta = (index / steps) * turns;
    const radius = size * (.012 + .53 * (theta / turns));
    const angle = theta - .45;
    const x = cx + Math.cos(angle) * radius * .88;
    const y = cy + size * .035 + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#102C46";
  ctx.lineWidth = Math.max(1.7, size * .032);
  ctx.stroke();
  ctx.strokeStyle = ridgeGradient;
  ctx.lineWidth = Math.max(1, size * .018);
  ctx.stroke();

  ctx.restore();
}