export async function createTypedSignatureImage(text, fontFamily) {
  await document.fonts.load(`64px ${fontFamily}`, text);
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#C7AD76";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 64;
  ctx.font = `${size}px ${fontFamily}`;
  while (ctx.measureText(text).width > 520 && size > 20) {
    size -= 4;
    ctx.font = `${size}px ${fontFamily}`;
  }
  ctx.fillText(text, 280, 80);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels.data[(y * canvas.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  const padding = 4;
  const trimmed = document.createElement("canvas");
  trimmed.width = Math.max(1, right - left + 1 + padding * 2);
  trimmed.height = Math.max(1, bottom - top + 1 + padding * 2);
  trimmed.getContext("2d").drawImage(canvas, left, top, right - left + 1, bottom - top + 1, padding, padding, right - left + 1, bottom - top + 1);
  return trimmed.toDataURL("image/png");
}

export async function createTypedSignatureWithDate(name, date, fontFamily) {
  await Promise.all([
    document.fonts.load(`64px ${fontFamily}`, name),
    document.fonts.load("64px Arial", date),
  ]);
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#C7AD76";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `64px ${fontFamily}`;
  ctx.fillText(name, 10, 105);
  const nameWidth = ctx.measureText(name).width;
  ctx.font = "64px Arial";
  ctx.fillText(` — ${date}`, nameWidth + 18, 105);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels.data[(y * canvas.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  const padding = 4;
  const trimmed = document.createElement("canvas");
  trimmed.width = right - left + 1 + padding * 2;
  trimmed.height = bottom - top + 1 + padding * 2;
  trimmed.getContext("2d").drawImage(canvas, left, top, right - left + 1, bottom - top + 1, padding, padding, right - left + 1, bottom - top + 1);
  return trimmed.toDataURL("image/png");
}