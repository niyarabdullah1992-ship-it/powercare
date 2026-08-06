// Single source of truth for report time periods across every section.
// Ids are canonical: month / 3months / 6months / year / custom (+ optional daily, weekly).
export const PERIODS = [
  { id: "month", months: 1 },
  { id: "3months", months: 3 },
  { id: "6months", months: 6 },
  { id: "year", months: 12 },
  { id: "custom" },
];

// Opt-in only — enabled through a PeriodPicker prop, never by default.
export const SHORT_PERIODS = [
  { id: "daily", days: 1 },
  { id: "weekly", days: 7 },
];

export const ALL_PERIODS = [...SHORT_PERIODS, ...PERIODS];

const LABELS = {
  daily: { ar: "يومي", en: "Daily" },
  weekly: { ar: "أسبوعي", en: "Weekly" },
  month: { ar: "شهر", en: "Month" },
  "3months": { ar: "٣ أشهر", en: "3 months" },
  "6months": { ar: "٦ أشهر", en: "6 months" },
  year: { ar: "سنة", en: "Year" },
  custom: { ar: "بين تاريخين", en: "Custom range" },
};

export function periodLabel(id, lang) {
  const entry = LABELS[id] || LABELS.month;
  return lang === "ar" ? entry.ar : entry.en;
}

const iso = (d) => d.toISOString();

function formatRange(startDate, endDate, lang) {
  const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", { day: "numeric", month: "long", year: "numeric" });
  return `${fmt.format(new Date(startDate))} – ${fmt.format(new Date(endDate))}`;
}

// Resolves a period id (plus custom from/to) into an absolute ISO range + label.
export function resolvePeriod(id, { from, to, lang = "en" } = {}) {
  const endDate = new Date();
  let startDate = new Date();

  if (id === "custom") {
    const start = from ? new Date(from) : null;
    const end = to ? new Date(to) : new Date();
    if (start && !Number.isNaN(start.getTime()) && end >= start) {
      return { id, startDate: iso(start), endDate: iso(end), label: formatRange(start, end, lang) };
    }
    startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());
    return { id, startDate: iso(startDate), endDate: iso(endDate), label: formatRange(startDate, endDate, lang) };
  }

  const config = ALL_PERIODS.find((p) => p.id === id) || PERIODS[0];
  if (config.days) startDate = new Date(endDate.getTime() - (config.days - 1) * 86400000);
  else startDate = new Date(endDate.getFullYear(), endDate.getMonth() - (config.months || 1), endDate.getDate());

  return { id: config.id, startDate: iso(startDate), endDate: iso(endDate), label: formatRange(startDate, endDate, lang) };
}