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

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function arUnit(n, one, two, few, many) {
  const abs = Math.abs(n);
  if (abs === 0) return many;
  if (abs === 1) return one;
  if (abs === 2) return two;
  if (abs >= 3 && abs <= 10) return few;
  return many;
}

/**
 * Smart open/elapsed duration: minutes → hours → days+hours.
 * Suitable for hazards that stay open across days.
 */
export function formatOpenDuration(openedAt, lang = "en", now = Date.now()) {
  if (!openedAt) return "";
  const start = new Date(openedAt).getTime();
  if (!Number.isFinite(start)) return "";
  const elapsed = Math.max(0, now - start);
  const ar = lang === "ar" || String(lang).startsWith("ar");

  if (elapsed < MINUTE_MS) {
    return ar ? "الآن — أقل من دقيقة" : "Just now — under a minute";
  }

  const days = Math.floor(elapsed / DAY_MS);
  const hours = Math.floor((elapsed % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((elapsed % HOUR_MS) / MINUTE_MS);

  if (days === 0 && hours === 0) {
    if (ar) {
      return `${minutes} ${arUnit(minutes, "دقيقة", "دقيقتان", "دقائق", "دقيقة")}`;
    }
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }

  if (days === 0) {
    if (minutes === 0) {
      if (ar) return `${hours} ${arUnit(hours, "ساعة", "ساعتان", "ساعات", "ساعة")}`;
      return hours === 1 ? "1 hour" : `${hours} hours`;
    }
    if (ar) {
      const h = `${hours} ${arUnit(hours, "ساعة", "ساعتان", "ساعات", "ساعة")}`;
      const m = `${minutes} ${arUnit(minutes, "دقيقة", "دقيقتان", "دقائق", "دقيقة")}`;
      return `${h} و ${m}`;
    }
    return `${hours}h ${minutes}m`;
  }

  // 1+ days: show days + hours (minutes drop away)
  if (ar) {
    const d = `${days} ${arUnit(days, "يوم", "يومان", "أيام", "يومًا")}`;
    if (hours === 0) return d;
    const h = `${hours} ${arUnit(hours, "ساعة", "ساعتان", "ساعات", "ساعة")}`;
    return `${d} و ${h}`;
  }

  if (hours === 0) {
    return days === 1 ? "1 day" : `${days} days`;
  }
  return days === 1 ? `1 day ${hours}h` : `${days} days ${hours}h`;
}

/** Compact label for chips: "مفتوح 2ي 5س" / "Open 2d 5h" */
export function formatOpenDurationShort(openedAt, lang = "en", now = Date.now()) {
  if (!openedAt) return "";
  const start = new Date(openedAt).getTime();
  if (!Number.isFinite(start)) return "";
  const elapsed = Math.max(0, now - start);
  const ar = lang === "ar" || String(lang).startsWith("ar");
  const days = Math.floor(elapsed / DAY_MS);
  const hours = Math.floor((elapsed % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((elapsed % HOUR_MS) / MINUTE_MS);

  if (elapsed < MINUTE_MS) return ar ? "<1د" : "<1m";
  if (days === 0 && hours === 0) return ar ? `${minutes}د` : `${minutes}m`;
  if (days === 0) return minutes ? (ar ? `${hours}س ${minutes}د` : `${hours}h ${minutes}m`) : (ar ? `${hours}س` : `${hours}h`);
  return hours ? (ar ? `${days}ي ${hours}س` : `${days}d ${hours}h`) : (ar ? `${days}ي` : `${days}d`);
}