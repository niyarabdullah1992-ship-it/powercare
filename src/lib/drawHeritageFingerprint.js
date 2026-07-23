export default function drawHeritageFingerprint(ctx, cx, cy, size) {
  const orange = "#e3a13a";
  const orangeTrack = "#e3a13a66";
  const orangeGlow = "#e3a13a";
  const paths = [
    [[-.48,-.27],[-.35,-.49],[0,-.56],[.35,-.49],[.48,-.27]],
    [[-.53,.02],[-.49,-.31],[-.26,-.5],[0,-.53],[.29,-.45],[.47,-.18],[.51,.12]],
    [[-.5,.29],[-.37,.14],[-.36,-.2],[-.18,-.41],[.08,-.46],[.33,-.29],[.41,.02],[.43,.3]],
    [[-.42,.43],[-.24,.27],[-.27,-.08],[-.13,-.33],[.11,-.36],[.29,-.16],[.3,.18],[.4,.42]],
    [[-.29,.5],[-.1,.31],[-.17,-.02],[-.06,-.25],[.13,-.26],[.22,-.06],[.16,.25],[.29,.51]],
    [[-.1,.54],[.05,.34],[-.04,.05],[.02,-.14],[.13,-.12],[.14,.08],[.04,.32],[.12,.53]],
    [[-.47,.12],[-.5,.32],[-.42,.48]],
    [[.48,.13],[.49,.34],[.42,.49]],
    [[-.34,.54],[-.18,.42],[-.08,.52]],
    [[.22,.51],[.35,.57],[.43,.48]],
  ];

  const trace = (path, color, width, dash = []) => {
    const points = path.map(([x, y]) => [cx + x * size, cy + y * size]);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length - 1; index += 1) {
      const [x, y] = points[index];
      const [nextX, nextY] = points[index + 1];
      ctx.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last[0], last[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = orangeGlow;
  ctx.shadowBlur = size * .08;
  paths.forEach((path) => trace(path, orangeTrack, size * .075));
  ctx.shadowBlur = 0;
  paths.forEach((path, index) => {
    const patterns = [[], [size * .12, size * .055], [0, size * .075]];
    trace(path, orange, size * .024, patterns[index % patterns.length]);
  });
  ctx.setLineDash([]);
  ctx.restore();
}