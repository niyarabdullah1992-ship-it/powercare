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

export function scopeLabel(scope, ar) {
  if (scope.type === "yearly") return ar ? `🏆 أهداف سنة ${scope.year}` : `🏆 ${scope.year} Annual Goals`;
  if (scope.type === "half") {
    return ar
      ? `النصف ${scope.half === 1 ? "الأول" : "الثاني"} H${scope.half} · ${scope.year}`
      : `Half-Year H${scope.half} · ${scope.year}`;
  }
  if (scope.type === "quarter") {
    const arNames = ["الأول", "الثاني", "الثالث", "الرابع"];
    return ar ? `الربع ${arNames[scope.quarter - 1]} Q${scope.quarter} · ${scope.year}` : `Quarter Q${scope.quarter} · ${scope.year}`;
  }
  const monthName = new Date(scope.year, scope.month, 1).toLocaleDateString(ar ? "ar" : "en", { month: "long" });
  return `${monthName} ${scope.year}`;
}

// Badge chip text + classes per scope type (literal Tailwind classes only).
export const SCOPE_BADGES = {
  yearly: { ar: "سنوي", en: "Yearly", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  half: { ar: "6 أشهر", en: "6 months", cls: "bg-purple-100 text-purple-800 border-purple-300" },
  quarter: { ar: "3 أشهر", en: "3 months", cls: "bg-sky-100 text-sky-800 border-sky-300" },
  monthly: { ar: "شهري", en: "Monthly", cls: "bg-muted text-muted-foreground border-border" },
};

// Groups tasks into ordered period sections: yearly first, then half-year,
// quarters, then months (newest month first). Newest year first.
export function groupTasksByPeriod(tasks, ar) {
  const map = new Map();
  for (const tg of tasks) {
    const scope = taskScope(tg);
    if (!map.has(scope.sortKey)) map.set(scope.sortKey, { key: scope.sortKey, scope, label: scopeLabel(scope, ar), tasks: [] });
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