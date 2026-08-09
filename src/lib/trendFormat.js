// Shared formatting helpers for trend screens.

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

// "2026-03" -> "مارس ٢٦" (ar) / "Mar 26" (en)
export function monthLabel(ym, ar) {
  const [year, month] = String(ym).split("-");
  const index = Number(month) - 1;
  const yy = String(year).slice(2);
  if (!ar) return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][index] || month} ${yy}`;
  return `${AR_MONTHS[index] || month} ${toArabicDigits(yy)}`;
}

export function toArabicDigits(value) {
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

// Drop leading empty periods so the axis starts at the first real data point.
export function trimLeadingEmpty(rows, hasValue) {
  const first = rows.findIndex(hasValue);
  return first <= 0 ? rows : rows.slice(first);
}

// Signed percentage change vs the previous period; null when there is no base.
export function deltaPct(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export const chartTooltip = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "0 6px 18px hsl(var(--foreground) / .12)",
  },
  labelStyle: { color: "hsl(var(--foreground))" },
  cursor: { stroke: "hsl(var(--border))", strokeWidth: 1, fill: "transparent" },
};

export const WARNING_COLOR = "#B54708";