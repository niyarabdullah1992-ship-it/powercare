function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandomSignature(seed) {
  const random = randomSource(seed);
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#B9975E";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const strokes = 3 + Math.floor(random() * 4);
  for (let stroke = 0; stroke < strokes; stroke += 1) {
    let x = 35 + random() * 80;
    let y = 72 + random() * 90;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const points = 8 + Math.floor(random() * 10);
    for (let point = 0; point < points; point += 1) {
      const nextX = x + 22 + random() * 45;
      const nextY = 42 + random() * 130;
      ctx.quadraticCurveTo(x + random() * 34, y + (random() - .5) * 95, nextX, nextY);
      x = nextX;
      y = nextY;
    }
    ctx.lineWidth = 3 + random() * 4;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(55, 176 + random() * 10);
  ctx.bezierCurveTo(230, 145 + random() * 35, 480, 205 - random() * 25, 670, 158 + random() * 22);
  ctx.lineWidth = 2.5 + random() * 2.5;
  ctx.stroke();
  return canvas.toDataURL("image/png");
}