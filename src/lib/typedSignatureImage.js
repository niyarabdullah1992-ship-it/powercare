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
  ctx.direction = /[\u0600-\u06ff]/.test(text) ? "rtl" : "ltr";
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
    document.fonts.load(`32px ${fontFamily}`, name),
    document.fonts.load("32px Arial", date),
  ]);
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  const isArabic = /[\u0600-\u06ff]/.test(name);
  ctx.fillStyle = "#C7AD76";
  ctx.textBaseline = "middle";
  ctx.direction = isArabic ? "rtl" : "ltr";
  let size = 32;
  ctx.font = `${size}px ${fontFamily}`;
  while (ctx.measureText(name).width > 690 && size > 20) {
    size -= 4;
    ctx.font = `${size}px ${fontFamily}`;
  }
  ctx.textAlign = "center";
  ctx.fillText(name, 355, 60, 690);
  const nameWidth = Math.min(ctx.measureText(name).width, 690);
  ctx.direction = "ltr";
  ctx.font = "32px Arial";
  const dateWidth = Math.min(ctx.measureText(date).width, 180);
  const dateCenter = Math.min(850, 355 + nameWidth / 2 + 18 + dateWidth / 2);
  ctx.textAlign = "center";
  ctx.fillText(date, dateCenter, 60, 180);

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
  const padding = 6;
  const trimmed = document.createElement("canvas");
  trimmed.width = Math.max(1, right - left + 1 + padding * 2);
  trimmed.height = Math.max(1, bottom - top + 1 + padding * 2);
  trimmed.getContext("2d").drawImage(canvas, left, top, right - left + 1, bottom - top + 1, padding, padding, right - left + 1, bottom - top + 1);
  return trimmed.toDataURL("image/png");
}