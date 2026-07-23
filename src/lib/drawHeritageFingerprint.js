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

  const circuitPaths = [
    [[.08, -.3], [.24, -.18], [.24, -.02]],
    [[.2, -.24], [.36, -.1], [.36, .04]],
    [[.31, .02], [.31, .15], [.18, .29]],
    [[.26, .16], [.13, .34], [-.02, .34]],
    [[.2, .31], [.08, .43], [-.12, .43]]
  ];

  circuitPaths.forEach((points) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      const px = cx + x * size;
      const py = cy + y * size;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = "#102C46";
    ctx.lineWidth = Math.max(3, size * .052);
    ctx.stroke();
    ctx.strokeStyle = ridgeGradient;
    ctx.lineWidth = Math.max(1.15, size * .021);
    ctx.stroke();

    const [endX, endY] = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(cx + endX * size, cy + endY * size, Math.max(2.3, size * .04), 0, Math.PI * 2);
    ctx.fillStyle = "#102C46";
    ctx.fill();
    ctx.strokeStyle = "#C7AD76";
    ctx.lineWidth = Math.max(1.1, size * .019);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + endX * size, cy + endY * size, Math.max(.65, size * .011), 0, Math.PI * 2);
    ctx.fillStyle = "#C7AD76";
    ctx.fill();
  });

  ctx.beginPath();
  ctx.ellipse(cx, cy, size * .455, size * .605, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#B9975E";
  ctx.lineWidth = Math.max(1, size * .018);
  ctx.stroke();

  ctx.restore();
}