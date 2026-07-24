export function getOrgDirectDropMode(element, clientX, clientY) {
  const rect = element.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  if (y < 0.24) return "above";
  if (x < 0.28) return "visual-left";
  if (x > 0.72) return "visual-right";
  return "inside";
}