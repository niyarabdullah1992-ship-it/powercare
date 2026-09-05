const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toRiyadhDateKey(value = new Date()) {
  if (typeof value === "string" && DATE_KEY_PATTERN.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return toRiyadhDateKey(new Date());
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}