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
  const ink = "#B9975E";
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3.2 + random() * 2.2;

  const baseline = 128 + random() * 25;
  const initialWidth = 105 + random() * 80;
  const initialTop = 25 + random() * 42;
  const slant = 18 + random() * 30;
  ctx.beginPath();
  ctx.moveTo(45 + random() * 24, baseline + 8);
  ctx.bezierCurveTo(28, initialTop + 28, 118, initialTop - 15, initialWidth, initialTop + 28);
  ctx.bezierCurveTo(initialWidth + 42, initialTop + 62, initialWidth - 24, baseline + 72, 82, baseline + 22);
  ctx.bezierCurveTo(122, baseline - 18, initialWidth + slant, baseline - 38, initialWidth + 34, baseline - 7);

  let x = initialWidth + 34;
  let y = baseline - 7;
  const letters = 5 + Math.floor(random() * 6);
  for (let index = 0; index < letters; index += 1) {
    const width = 32 + random() * 33;
    const height = 20 + random() * 34;
    const dip = 7 + random() * 17;
    ctx.bezierCurveTo(x + width * .18, y - height, x + width * .46, y - height, x + width * .58, y - dip);
    ctx.bezierCurveTo(x + width * .72, y + dip, x + width * .88, y + dip, x + width, y - random() * 15);
    x += width;
    y = baseline - random() * 13;
  }
  ctx.bezierCurveTo(x + 45, y + 18, x + 95, y - 32, Math.min(675, x + 130), baseline - 27);
  ctx.stroke();

  if (random() > .35) {
    ctx.beginPath();
    const underlineY = baseline + 39 + random() * 22;
    ctx.moveTo(72 + random() * 70, underlineY);
    ctx.bezierCurveTo(260, underlineY - 34, 470, underlineY + 18, 650 - random() * 35, underlineY - 20);
    ctx.lineWidth = 2.2 + random() * 2.3;
    ctx.stroke();
  }

  if (random() > .56) {
    ctx.beginPath();
    const loopX = 175 + random() * 240;
    ctx.moveTo(loopX, baseline - 5);
    ctx.bezierCurveTo(loopX - 45, baseline - 88, loopX + 55, baseline - 105, loopX + 42, baseline - 18);
    ctx.stroke();
  }

  return canvas.toDataURL("image/png");
}