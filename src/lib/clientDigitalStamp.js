import { drawStampThemeFrame } from "@/lib/signatureStampThemes";
import drawStampFingerprint from "@/lib/drawStampFingerprint";

const GOLD = "#C7AD76";
const GOLD_LIGHT = "#E2D1A7";

// Builds the client's digital approval stamp (PowerCare "Neo" identity) as a canvas.
export function drawClientStamp(canvas, { name, title, proofNumber, ar }) {
  const width = 560;
  const height = 180;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  drawStampThemeFrame(ctx, width, height, "neo");
  drawStampFingerprint(ctx, 56, height / 2, 92, "neo");

  const x = ar ? width - 28 : 128;
  ctx.textAlign = ar ? "right" : "left";
  ctx.textBaseline = "middle";

  ctx.fillStyle = GOLD;
  ctx.font = "600 15px 'Inter Tight', system-ui, sans-serif";
  ctx.fillText(ar ? "توقيع رقمي معتمد" : "VERIFIED DIGITAL SIGNATURE", x, 46);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 26px 'Inter Tight', system-ui, sans-serif";
  ctx.fillText(name, x, 82);

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "400 15px 'Inter Tight', system-ui, sans-serif";
  if (title) ctx.fillText(title, x, 110);

  ctx.fillStyle = "#C7AD76CC";
  ctx.font = "400 13px 'Courier New', monospace";
  ctx.fillText(`${proofNumber} · ${new Date().toLocaleString(ar ? "ar" : "en")}`, x, 142);
}

export function stampBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}