/** Client mirror of base44/shared/opsDerivations.ts — keep in sync. */

export const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };

export const CERT_FOR = { pm: "loto", cm: "loto", em: "fa", pr: "wah", cp: null };

export function clampEffortWeight(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function taskPoints(priority, effortWeight) {
  const pv = PRIORITY_VALUE[String(priority || "medium")] ?? 1;
  return pv * clampEffortWeight(effortWeight);
}

function localDayStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dayDiffFromToday(iso, today = new Date()) {
  if (!iso) return NaN;
  const due = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(due.getTime())) return NaN;
  return Math.round((due.getTime() - localDayStart(today).getTime()) / 86400000);
}

export function planHorizonFromDue(iso, today = new Date()) {
  if (!iso) return "w";
  const d = dayDiffFromToday(iso, today);
  if (Number.isNaN(d)) return "w";
  if (d <= 7) return "w";
  if (d <= 31) return "m";
  if (d <= 92) return "q";
  if (d <= 183) return "h";
  return "y";
}

export function deriveOpsCounts(tasks, today = new Date()) {
  const list = Array.isArray(tasks) ? tasks : [];
  const isDone = (t) => t.status === "completed" || !!t.approvedAt;
  const isOverdue = (t) => {
    if (!t.dueAt || isDone(t)) return false;
    return dayDiffFromToday(t.dueAt, today) < 0;
  };
  const isToday = (t) => t.dueAt && dayDiffFromToday(t.dueAt, today) === 0;
  const isAwaiting = (t) => {
    if (t.status === "awaiting_approval" || t.status === "pending_review") return true;
    const done = Number(t.completedCount) || 0;
    const target = Math.max(1, Number(t.targetCount) || 1);
    return done >= target && !t.approvedAt && t.status !== "completed";
  };
  const done = list.filter(isDone).length;
  const overdue = list.filter(isOverdue).length;
  const dueToday = list.filter(isToday).length;
  const awaiting = list.filter(isAwaiting).length;
  return {
    total: list.length,
    done,
    overdue,
    today: dueToday,
    awaiting,
    active: Math.max(0, list.length - done),
    badge: overdue + awaiting,
    pointsAwarded: list.reduce((n, t) => n + (Number(t.pointsAwarded) || 0), 0),
  };
}

export function deriveHorizonGroups(tasks) {
  const order = ["y", "h", "q", "m", "w"];
  const list = Array.isArray(tasks) ? tasks : [];
  return order.map((id) => {
    const rows = list.filter((t) => (t.planHorizon || "w") === id);
    const units = rows.reduce(
      (acc, t) => ({
        done: acc.done + (Number(t.completedCount) || 0),
        target: acc.target + Math.max(1, Number(t.targetCount) || 1),
      }),
      { done: 0, target: 0 },
    );
    const pct = units.target ? Math.round((units.done / units.target) * 100) : 0;
    return { id, count: rows.length, unitsDone: units.done, unitsTarget: units.target, pct };
  });
}
