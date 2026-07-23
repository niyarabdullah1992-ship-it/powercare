export default function drawHeritageFingerprint(ctx, cx, cy, size) {
  const gold = "#d4af55";
  const glow = "#f1d47a";
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const paths = [
    [[-.42,-.22],[-.3,-.44],[0,-.5],[.3,-.44],[.42,-.22]],
    [[-.48,-.04],[-.43,-.3],[-.24,-.48],[0,-.55],[.24,-.48],[.43,-.3],[.48,-.04]],
    [[-.5,.15],[-.46,-.15],[-.31,-.39],[-.08,-.5],[.15,-.47],[.36,-.29],[.43,.02]],
    [[-.48,.3],[-.36,.18],[-.34,-.13],[-.18,-.36],[.06,-.42],[.28,-.28],[.34,.04],[.4,.27]],
    [[-.38,.41],[-.22,.28],[-.24,-.08],[-.12,-.29],[.08,-.34],[.24,-.18],[.22,.16],[.34,.4]],
    [[-.25,.48],[-.1,.31],[-.14,-.05],[-.05,-.23],[.1,-.25],[.17,-.1],[.12,.19],[.25,.5]],
    [[-.08,.5],[.02,.34],[-.04,.02],[.02,-.14],[.1,-.14],[.13,-.02],[.03,.24],[.1,.48]],
    [[-.43,.1],[-.48,.28],[-.42,.42]],
    [[.43,.12],[.46,.31],[.41,.44]],
  ];

  const stroke = (color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    paths.forEach((points) => {
      ctx.beginPath();
      const scaled = points.map(([x, y]) => [cx + x * size, cy + y * size]);
      ctx.moveTo(scaled[0][0], scaled[0][1]);
      for (let index = 1; index < scaled.length - 1; index += 1) {
        const [x, y] = scaled[index];
        const [nextX, nextY] = scaled[index + 1];
        ctx.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2);
      }
      const last = scaled[scaled.length - 1];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    });
  };

  ctx.globalAlpha = .28;
  stroke(glow, size * .075);
  ctx.globalAlpha = 1;
  stroke(gold, size * .045);
  ctx.restore();
}