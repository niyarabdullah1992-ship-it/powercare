import moment from "moment";
import { toArabicDigits } from "@/lib/trendFormat";

// One period concept for the whole Performance section: the user picks a RANGE,
// the system derives the grouping unit. Range and grouping are never mixed.
export const PERIOD_PRESETS = [
  { val: "last7", ar: "آخر ٧ أيام", en: "Last 7 days" },
  { val: "last30", ar: "آخر ٣٠ يوماً", en: "Last 30 days" },
  { val: "quarter", ar: "هذا الربع", en: "This quarter" },
  { val: "year", ar: "هذه السنة", en: "This year" },
  { val: "mtd", ar: "الشهر الحالي حتى اليوم", en: "Month to date" },
  { val: "ytd", ar: "السنة حتى اليوم", en: "Year to date" },
  { val: "custom", ar: "فترة مخصصة", en: "Custom range" },
];

export function presetLabel(val, ar) {
  const preset = PERIOD_PRESETS.find((p) => p.val === val);
  return preset ? (ar ? preset.ar : preset.en) : val;
}

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function bucketFor(days) {
  if (days <= 14) return "day";
  if (days <= 92) return "week";
  return "month";
}

// Resolves a preset into concrete boundaries, the derived grouping unit and the
// matching previous window used for every comparison on the screen.
export function resolvePeriod(preset, customStart, customEnd) {
  const now = moment();
  let start;
  let end = moment(now);

  if (preset === "custom") {
    start = customStart ? moment(customStart) : moment(now).subtract(30, "days");
    end = customEnd ? moment(customEnd).endOf("day") : moment(now);
  } else if (preset === "last7") start = moment(now).subtract(6, "days").startOf("day");
  else if (preset === "quarter") start = moment(now).startOf("quarter");
  else if (preset === "year") start = moment(now).startOf("year");
  else if (preset === "mtd") start = moment(now).startOf("month");
  else if (preset === "ytd") start = moment(now).startOf("year");
  else start = moment(now).subtract(29, "days").startOf("day");

  const spanDays = Math.max(1, end.diff(start, "days") + 1);
  const previousEnd = moment(start).subtract(1, "millisecond");
  const previousStart = moment(previousEnd).subtract(spanDays - 1, "days").startOf("day");

  return {
    start: start.toDate(),
    end: end.toDate(),
    previousStart: previousStart.toDate(),
    previousEnd: previousEnd.toDate(),
    bucket: bucketFor(spanDays),
    spanDays,
  };
}

// "١٠ يوليو — ٩ أغسطس ٢٠٢٦"
export function formatRangeText(start, end, ar) {
  const s = moment(start);
  const e = moment(end);
  if (!ar) return `${s.format("D MMM")} — ${e.format("D MMM YYYY")}`;
  const day = (m) => toArabicDigits(m.format("D"));
  return `${day(s)} ${AR_MONTHS[s.month()]} — ${day(e)} ${AR_MONTHS[e.month()]} ${toArabicDigits(e.format("YYYY"))}`;
}