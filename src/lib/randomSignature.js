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

export function createRandomSignature(seed, signerName = "") {
  const random = randomSource(seed);
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");
  const ink = "#B9975E";
  const words = signerName.trim().split(/\s+/).filter(Boolean);
  const initials = words.map((word) => word[0]).join("");
  const variants = [signerName.trim(), words[0], initials].filter(Boolean);
  const signatureText = variants[Math.floor(random() * variants.length)] || "Signature";
  const isArabic = /[\u0600-\u06FF]/.test(signatureText);
  const fonts = isArabic ? ["Aref Ruqaa", "Lateef", "Amiri"] : ["Great Vibes", "Allura", "Dancing Script", "Alex Brush"];
  const font = fonts[Math.floor(random() * fonts.length)];
  const baseline = 130 + random() * 26;
  const textX = 92 + random() * 38;
  const fontSize = 62 + random() * 28;

  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.font = `${fontSize}px '${font}'`;
  ctx.direction = isArabic ? "rtl" : "ltr";
  ctx.textAlign = isArabic ? "right" : "left";
  ctx.fillText(signatureText, isArabic ? 625 : textX, baseline, 520);

  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.lineWidth = 2.8 + random() * 2.3;
  ctx.beginPath();
  ctx.moveTo(50 + random() * 22, baseline + 12);
  ctx.bezierCurveTo(22, 43 + random() * 34, 126, 10 + random() * 25, 176 + random() * 50, 66);
  ctx.bezierCurveTo(220 + random() * 35, 112, 137, 184 + random() * 18, 82, baseline + 25);
  ctx.bezierCurveTo(150, baseline - 22, 245, baseline - 32, 315 + random() * 75, baseline - 5);
  ctx.stroke();

  if (random() > .25) {
    ctx.beginPath();
    const y = baseline + 38 + random() * 26;
    ctx.moveTo(65 + random() * 75, y);
    ctx.bezierCurveTo(250, y - 36, 472, y + 20, 665 - random() * 35, y - 24);
    ctx.lineWidth = 2 + random() * 2.4;
    ctx.stroke();
  }

  if (random() > .48) {
    ctx.beginPath();
    const loopX = 225 + random() * 250;
    ctx.moveTo(loopX, baseline + 6);
    ctx.bezierCurveTo(loopX - 42, baseline - 76, loopX + 48, baseline - 103, loopX + 37, baseline - 12);
    ctx.bezierCurveTo(loopX + 28, baseline + 35, loopX + 72, baseline + 30, loopX + 108, baseline - 4);
    ctx.stroke();
  }

  if (random() > .58) {
    ctx.beginPath();
    ctx.moveTo(115, baseline - 18);
    ctx.bezierCurveTo(285, baseline + 25, 455, baseline - 44, 632, baseline - 12);
    ctx.lineWidth = 1.7 + random() * 1.8;
    ctx.stroke();
  }

  return canvas.toDataURL("image/png");
}