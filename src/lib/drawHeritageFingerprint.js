export default function drawHeritageFingerprint(ctx, cx, cy, size) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * .54, size * .62, 0, 0, Math.PI * 2);
  ctx.clip();

  const ridgeGradient = ctx.createLinearGradient(cx - size * .5, cy - size * .5, cx + size * .5, cy + size * .5);
  ridgeGradient.addColorStop(0, "#E2D1A7");
  ridgeGradient.addColorStop(.48, "#C7AD76");
  ridgeGradient.addColorStop(1, "#9E7C47");

  const drawSpiral = (centerX, centerY, direction, phase) => {
    const turns = Math.PI * 10;
    const steps = 260;
    ctx.beginPath();
    for (let index = 0; index <= steps; index += 1) {
      const theta = (index / steps) * turns;
      const radius = size * (.018 + .45 * (theta / turns));
      const angle = direction * theta + phase;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * .84;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#102C46";
    ctx.lineWidth = Math.max(4, size * .078);
    ctx.stroke();
    ctx.strokeStyle = ridgeGradient;
    ctx.lineWidth = Math.max(2.2, size * .042);
    ctx.stroke();
  };

  drawSpiral(cx + size * .17, cy - size * .18, 1, -.35);
  drawSpiral(cx - size * .18, cy + size * .2, -1, .55);

  ctx.beginPath();
  ctx.moveTo(cx - size * .45, cy - size * .46);
  ctx.lineTo(cx + size * .46, cy + size * .49);
  ctx.strokeStyle = "#102C46";
  ctx.lineWidth = Math.max(6, size * .13);
  ctx.stroke();
  ctx.strokeStyle = ridgeGradient;
  ctx.lineWidth = Math.max(3.5, size * .074);
  ctx.stroke();
  ctx.restore();
}