export function getVisibleImageBounds(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3] > 12) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) return { x: 0, y: 0, width: canvas.width, height: canvas.height };
  const padding = 4;
  const x = Math.max(0, left - padding);
  const y = Math.max(0, top - padding);
  return {
    x,
    y,
    width: Math.min(canvas.width, right + padding + 1) - x,
    height: Math.min(canvas.height, bottom + padding + 1) - y,
  };
}