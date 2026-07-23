export async function createTypedSignatureImage(text, fontFamily) {
  await document.fonts.load(`64px ${fontFamily}`, text);
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#b07d3f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 64;
  ctx.font = `${size}px ${fontFamily}`;
  while (ctx.measureText(text).width > 520 && size > 20) {
    size -= 4;
    ctx.font = `${size}px ${fontFamily}`;
  }
  ctx.fillText(text, 280, 80);
  return canvas.toDataURL("image/png");
}