export function movementNumber(entry) {
  if (entry?.movementNumber) return entry.movementNumber;
  const year = entry?.created_date ? new Date(entry.created_date).getFullYear() : new Date().getFullYear();
  const suffix = String(entry?.id || "000000").slice(-6).toUpperCase();
  return `MOV-${year}-${suffix}`;
}