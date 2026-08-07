// Time-scope archive for tasks: each task is classified by its DURATION
// (monthly / quarterly / half-year / yearly) derived from start_date → end_date,
// then grouped under the matching period of its start date. Long-term tasks
// surface above monthly ones so annual goals are never buried in a month.

const DAY = 86400000;

export function taskScope(tg) {
  const start = new Date(tg.start_date || tg.created_at || Date.now());
  const end = tg.end_date ? new Date(tg.end_date) : start;
  const days = Math.round((end.getTime() - start.getTime()) / DAY);
  const y = start.getFullYear();
  if (days > 200) return { type: "yearly", year: y, sortKey: `${y}-0Y` };
  if (days > 100) {
    const h = start.getMonth() < 6 ? 1 : 2;
    return { type: "half", half: h, year: y, sortKey: `${y}-1H${h}` };
  }
  if (days > 45) {
    const q = Math.floor(start.getMonth() / 3) + 1;
    return { type: "quarter", quarter: q, year: y, sortKey: `${y}-2Q${q}` };
  }
  const m = start.getMonth();
  return { type: "monthly", month: m, year: y, sortKey: `${y}-3M${String(m).padStart(2, "0")}` };
}

// Fully localized period label — month names use the active locale directly,
// and the fixed words come from the shared i18n dictionary (t).
export function scopeLabel(scope, lang, t) {
  if (scope.type === "yearly") return `🏆 ${t("annualGoals")} · ${scope.year}`;
  if (scope.type === "half") return `${t("halfYearLabel")} H${scope.half} · ${scope.year}`;
  if (scope.type === "quarter") return `${t("quarterLabel")} Q${scope.quarter} · ${scope.year}`;
  const monthName = new Date(scope.year, scope.month, 1).toLocaleDateString(lang || "en", { month: "long" });
  return `${monthName} ${scope.year}`;
}

// Badge chip per scope type: i18n key + classes (literal Tailwind classes only).
export const SCOPE_BADGES = {
  yearly: { key: "scopeYearly", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  half: { key: "scopeHalf", cls: "bg-purple-100 text-purple-800 border-purple-300" },
  quarter: { key: "scopeQuarter", cls: "bg-sky-100 text-sky-800 border-sky-300" },
  monthly: { key: "scopeMonthly", cls: "bg-muted text-muted-foreground border-border" },
};

// Groups tasks into ordered period sections: yearly first, then half-year,
// quarters, then months (newest month first). Newest year first.
export function groupTasksByPeriod(tasks, lang, t) {
  const map = new Map();
  for (const tg of tasks) {
    const scope = taskScope(tg);
    if (!map.has(scope.sortKey)) map.set(scope.sortKey, { key: scope.sortKey, scope, label: scopeLabel(scope, lang, t), tasks: [] });
    map.get(scope.sortKey).tasks.push(tg);
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.scope.year !== b.scope.year) return b.scope.year - a.scope.year; // newest year first
    const rank = { yearly: 0, half: 1, quarter: 2, monthly: 3 };
    if (rank[a.scope.type] !== rank[b.scope.type]) return rank[a.scope.type] - rank[b.scope.type];
    // Within the same type: newest period first.
    return b.key.localeCompare(a.key);
  });
}