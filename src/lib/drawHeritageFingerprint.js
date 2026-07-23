export default function drawHeritageFingerprint(ctx, cx, cy, size) {
  const paths = [
    [[-.48,-.27],[-.35,-.49],[0,-.56],[.35,-.49],[.48,-.27]],
    [[-.53,.02],[-.49,-.31],[-.26,-.5],[0,-.53],[.29,-.45],[.47,-.18],[.51,.12]],
    [[-.5,.29],[-.37,.14],[-.36,-.2],[-.18,-.41],[.08,-.46],[.33,-.29],[.41,.02],[.43,.3]],
    [[-.42,.43],[-.24,.27],[-.27,-.08],[-.13,-.33],[.11,-.36],[.29,-.16],[.3,.18],[.4,.42]],
    [[-.29,.5],[-.1,.31],[-.17,-.02],[-.06,-.25],[.13,-.26],[.22,-.06],[.16,.25],[.29,.51]],
    [[-.1,.54],[.05,.34],[-.04,.05],[.02,-.14],[.13,-.12],[.14,.08],[.04,.32],[.12,.53]],
    [[-.47,.12],[-.5,.32],[-.42,.48]], [[.48,.13],[.49,.34],[.42,.49]],
    [[-.34,.54],[-.18,.42],[-.08,.52]], [[.22,.51],[.35,.57],[.43,.48]],
    [[-.22,.38],[-.2,.12],[-.16,-.08]], [[-.11,.48],[-.09,.18],[-.06,-.12]],
    [[0,.5],[.01,.18],[.03,-.16]], [[.11,.46],[.12,.18],[.11,-.1]],
    [[.22,.38],[.21,.16],[.18,-.03]],
  ];

  const trace = (path) => {
    const points = path.map(([x, y]) => [cx + x * size, cy + y * size]);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length - 1; i += 1) {
      const mx = (points[i][0] + points[i + 1][0]) / 2;
      const my = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][1], mx, my);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last[0], last[1]);
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const fiberGradient = ctx.createLinearGradient(cx - size * .58, cy - size * .5, cx + size * .58, cy + size * .48);
  fiberGradient.addColorStop(0, "#FFF0A6");
  fiberGradient.addColorStop(.44, "#FFD05A");
  fiberGradient.addColorStop(.72, "#FF9A18");
  fiberGradient.addColorStop(1, "#F66A00");

  paths.forEach((path) => {
    trace(path);
    ctx.strokeStyle = "#102C46";
    ctx.lineWidth = Math.max(4, size * .088);
    ctx.stroke();
    trace(path);
    ctx.strokeStyle = fiberGradient;
    ctx.lineWidth = Math.max(2.4, size * .054);
    ctx.stroke();
  });
  ctx.restore();
}