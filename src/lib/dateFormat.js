// Explicit Gregorian-calendar date formatting. Some locales (e.g. Arabic/Saudi) can
// default to the Hijri calendar in the browser — dates in this app are always shown
// using the Gregorian calendar regardless of the active UI language.
export function formatDate(date, lang = "en", options = {}) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang, { calendar: "gregory", ...options }).format(d);
}

export function formatDateTime(date, lang = "en") {
  return formatDate(date, lang, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}