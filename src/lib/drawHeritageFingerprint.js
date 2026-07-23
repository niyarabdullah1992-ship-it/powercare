export default function drawHeritageFingerprint(ctx, cx, cy, size) {
  const cubeSize = size * .082;
  const lightOrange = { top: "#FFD36A", left: "#F5A623", right: "#D97800" };
  const deepOrange = { top: "#FF9F1A", left: "#E87900", right: "#A94700" };
  const outline = "#5A2800";
  const paths = [
    [[-.48,-.27],[-.35,-.49],[0,-.56],[.35,-.49],[.48,-.27]],
    [[-.53,.02],[-.49,-.31],[-.26,-.5],[0,-.53],[.29,-.45],[.47,-.18],[.51,.12]],
    [[-.5,.29],[-.37,.14],[-.36,-.2],[-.18,-.41],[.08,-.46],[.33,-.29],[.41,.02],[.43,.3]],
    [[-.42,.43],[-.24,.27],[-.27,-.08],[-.13,-.33],[.11,-.36],[.29,-.16],[.3,.18],[.4,.42]],
    [[-.29,.5],[-.1,.31],[-.17,-.02],[-.06,-.25],[.13,-.26],[.22,-.06],[.16,.25],[.29,.51]],
    [[-.1,.54],[.05,.34],[-.04,.05],[.02,-.14],[.13,-.12],[.14,.08],[.04,.32],[.12,.53]],
    [[-.47,.12],[-.5,.32],[-.42,.48]], [[.48,.13],[.49,.34],[.42,.49]],
    [[-.34,.54],[-.18,.42],[-.08,.52]], [[.22,.51],[.35,.57],[.43,.48]],
  ];
  const coreColumns = [
    [[-.22,.38],[-.2,.12],[-.16,-.08]], [[-.11,.48],[-.09,.18],[-.06,-.12]],
    [[0,.5],[.01,.18],[.03,-.16]], [[.11,.46],[.12,.18],[.11,-.1]],
    [[.22,.38],[.21,.16],[.18,-.03]],
  ];

  const drawCube = (x, y, palette) => {
    const half = cubeSize / 2, top = cubeSize * .28, depth = cubeSize * .62;
    const face = (points, color) => {
      ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = outline;
      ctx.lineWidth = Math.max(.45, size * .008); ctx.stroke();
    };
    face([[x,y-top],[x+half,y],[x,y+top],[x-half,y]], palette.top);
    face([[x-half,y],[x,y+top],[x,y+top+depth],[x-half,y+depth]], palette.left);
    face([[x+half,y],[x,y+top],[x,y+top+depth],[x+half,y+depth]], palette.right);
  };

  const stampPath = (path, pathIndex) => {
    let sequence = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const [ax, ay] = path[i], [bx, by] = path[i + 1];
      const distance = Math.hypot((bx - ax) * size, (by - ay) * size);
      const steps = Math.max(1, Math.ceil(distance / (cubeSize * .88)));
      for (let step = i ? 1 : 0; step <= steps; step += 1) {
        const t = step / steps;
        const palette = (Math.floor(sequence / 3) + pathIndex) % 3 === 0 ? lightOrange : deepOrange;
        drawCube(cx + (ax + (bx - ax) * t) * size, cy + (ay + (by - ay) * t) * size, palette);
        sequence += 1;
      }
    }
  };

  ctx.save();
  ctx.lineJoin = "round";
  paths.forEach(stampPath);
  coreColumns.forEach((path, index) => stampPath(path, index + 2));
  ctx.restore();
}