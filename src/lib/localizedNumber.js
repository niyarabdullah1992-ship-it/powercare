export function normalizeLocalizedNumber(value) {
  return String(value ?? "").replace(/[^0-9.]/g, "");
}