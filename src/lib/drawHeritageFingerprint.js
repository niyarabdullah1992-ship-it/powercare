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

  const drawSpiral = (centerX, centerY, direction, phase, upperHalf) => {
    ctx.save();
    ctx.beginPath();
    if (upperHalf) {
      ctx.moveTo(cx - size * .58, cy - size * .72);
      ctx.lineTo(cx + size * .58, cy - size * .72);
      ctx.lineTo(cx + size * .58, cy + size * .72);
    } else {
      ctx.moveTo(cx - size * .58, cy - size * .72);
      ctx.lineTo(cx - size * .58, cy + size * .72);
      ctx.lineTo(cx + size * .58, cy + size * .72);
    }
    ctx.closePath();
    ctx.clip();

    const turns = Math.PI * 16;
    const steps = 420;
    ctx.beginPath();
    for (let index = 0; index <= steps; index += 1) {
      const theta = (index / steps) * turns;
      const radius = size * (.012 + .43 * (theta / turns));
      const angle = direction * theta + phase;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * .88;
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
  };

  drawSpiral(cx + size * .15, cy - size * .19, 1, -.22, true);
  drawSpiral(cx - size * .16, cy + size * .2, -1, .48, false);

  ctx.beginPath();
  ctx.moveTo(cx - size * .43, cy - size * .47);
  ctx.bezierCurveTo(cx - size * .2, cy - size * .2, cx + size * .22, cy + size * .2, cx + size * .43, cy + size * .48);
  ctx.bezierCurveTo(cx + size * .16, cy + size * .27, cx - size * .25, cy - size * .12, cx - size * .43, cy - size * .47);
  ctx.closePath();
  ctx.fillStyle = ridgeGradient;
  ctx.fill();
  ctx.strokeStyle = "#102C46";
  ctx.lineWidth = Math.max(1.3, size * .024);
  ctx.stroke();

  ctx.restore();
}