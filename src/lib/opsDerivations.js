/** Client mirror of base44/shared/opsDerivations.ts — keep in sync. */
import { deriveBranchEscalationChain } from "./orgDerivations.js";
import { userCoversStation } from "./stationTree.js";

export const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };

/** Flexible work kinds — office and field companies alike. Default is general. */
export const WORK_KINDS = ["gn", "ad", "of", "tr", "pm", "cm", "em", "pr", "cp"];

export const WORK_KIND_LABELS = {
  gn: { ar: "عام", en: "General" },
  ad: { ar: "إداري", en: "Administrative" },
  of: { ar: "مكتبي / تنسيقي", en: "Office / coordination" },
  tr: { ar: "تدريب / تطوير", en: "Training / development" },
  pm: { ar: "صيانة وقائية", en: "Preventive maintenance" },
  cm: { ar: "صيانة تصحيحية", en: "Corrective maintenance" },
  em: { ar: "طارئ", en: "Emergency" },
  pr: { ar: "مشروع", en: "Project" },
  cp: { ar: "امتثال", en: "Compliance" },
};

/** Optional competency hint for field kinds only — never required for assignment. */
export const CERT_FOR = {
  gn: null,
  ad: null,
  of: null,
  tr: null,
  pm: "loto",
  cm: "loto",
  em: "fa",
  pr: "wah",
  cp: null,
};

export const CERT_LABELS = {
  fa: { ar: "الإسعافات الأولية", en: "First aid" },
  loto: { ar: "العزل والوسم LOTO", en: "Lock-out / tag-out" },
  wah: { ar: "العمل على ارتفاع", en: "Work at height" },
  cs: { ar: "الأماكن المحصورة", en: "Confined space" },
};

export function normalizeWorkKind(raw, fallback = "gn") {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return fallback;
  const id = trimmed.toLowerCase();
  if (WORK_KINDS.includes(id)) return id;
  // Free-text custom work type for companies outside the preset list.
  return trimmed.slice(0, 80);
}

export function workKindLabel(kind, lang = "ar") {
  const id = String(kind || "").trim();
  if (!id) return lang === "en" ? "General" : "عام";
  if (WORK_KIND_LABELS[id]) return WORK_KIND_LABELS[id][lang === "en" ? "en" : "ar"];
  return id;
}

export function clampEffortWeight(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** Points = priority value (3/2/1) × effort weight (1–5). Granted only after approval. */
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

export function isoDayKey(value, today = new Date()) {
  if (!value) {
    const d = today instanceof Date ? today : new Date(today);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = raw.length === 10 ? new Date(`${raw}T00:00:00`) : new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function calendarDaysInclusive(fromIso, toIso) {
  const from = isoDayKey(fromIso);
  const to = isoDayKey(toIso);
  if (!from || !to) return 0;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

/** Normalize { "YYYY-MM-DD": n } day quotas. Drops empty/invalid days. */
export function normalizePaceDayPlan(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    const day = isoDayKey(key);
    const n = Math.max(0, Math.round(Number(val) || 0));
    if (!day || n <= 0) continue;
    out[day] = (out[day] || 0) + n;
  }
  return out;
}

export function paceDayPlanEntries(raw) {
  const plan = normalizePaceDayPlan(raw);
  return Object.keys(plan)
    .sort()
    .map((day) => ({ day, amount: plan[day] }));
}

export function paceDayPlanTotal(raw) {
  return paceDayPlanEntries(raw).reduce((sum, row) => sum + row.amount, 0);
}

/** Spread targetCount evenly — or by paceDayPlan custom day quotas. Derived todayExpected; plan is stored. */
export function deriveDailyTaskPace({
  targetCount,
  completedCount = 0,
  dueAt,
  startAt,
  paceStartAt,
  paceSpreadTarget,
  paceDayPlan,
  today = new Date(),
} = {}) {
  const target = Math.max(0, Math.round(Number(targetCount) || 0));
  const done = Math.max(0, Number(completedCount) || 0);
  const remaining = Math.max(0, target - done);
  const todayKey = isoDayKey(today);
  const due = isoDayKey(dueAt);
  const start = isoDayKey(startAt) || todayKey;
  const plan = normalizePaceDayPlan(paceDayPlan);
  const planEntries = paceDayPlanEntries(plan);
  const hasCustom = planEntries.length > 0;
  const rebaseRaw = !hasCustom && paceStartAt != null && String(paceStartAt).trim() !== ""
    ? isoDayKey(paceStartAt)
    : "";
  const redistributed = Boolean(rebaseRaw);
  const empty = {
    active: false,
    target,
    done,
    remaining,
    days: 0,
    daysLeft: 0,
    even: 0,
    extra: 0,
    todayExpected: 0,
    overdue: false,
    notYet: false,
    due: due || "",
    start: start || "",
    redistributed: false,
    custom: false,
    spreadTarget: target,
    baseDone: 0,
    dayPlan: {},
  };

  if (hasCustom) {
    const planTotal = paceDayPlanTotal(plan);
    const lastDay = planEntries[planEntries.length - 1].day;
    const firstDay = planEntries[0].day;
    const effectiveDue = due || lastDay;
    const overdue = todayKey > effectiveDue;
    const notYet = !overdue && todayKey < firstDay;
    const plannedLeft = planEntries.filter((row) => row.day >= todayKey && row.day <= effectiveDue).length;
    let todayExpected = 0;
    if (overdue) {
      todayExpected = remaining;
    } else if (!notYet) {
      todayExpected = Math.min(remaining, Math.max(0, Number(plan[todayKey]) || 0));
    }
    return {
      active: target > 0 && planTotal > 0,
      target,
      done,
      remaining,
      days: planEntries.length,
      daysLeft: overdue ? 0 : Math.max(plannedLeft, calendarDaysInclusive(todayKey, effectiveDue)),
      even: 0,
      extra: 0,
      todayExpected,
      overdue,
      notYet,
      due: effectiveDue,
      start: firstDay,
      redistributed: false,
      custom: true,
      spreadTarget: planTotal,
      baseDone: 0,
      dayPlan: plan,
    };
  }

  if (target < 1 || !due) return empty;
  const windowStart = redistributed
    ? (rebaseRaw <= due ? rebaseRaw : due)
    : (start <= due ? start : due);
  const spreadTarget = redistributed
    ? Math.max(0, Math.round(Number(paceSpreadTarget != null ? paceSpreadTarget : remaining) || 0))
    : target;
  const baseDone = redistributed ? Math.max(0, target - spreadTarget) : 0;
  const days = Math.max(1, calendarDaysInclusive(windowStart, due));
  const even = Math.floor(spreadTarget / days);
  const extra = spreadTarget % days;
  const overdue = todayKey > due;
  const beforeStart = todayKey < windowStart;
  let todayExpected = 0;
  if (overdue) {
    todayExpected = remaining;
  } else if (!beforeStart) {
    const dayIndex = Math.min(days - 1, Math.max(0, calendarDaysInclusive(windowStart, todayKey) - 1));
    todayExpected = even + (dayIndex < extra ? 1 : 0);
    todayExpected = Math.min(remaining, todayExpected);
  }
  return {
    active: true,
    target,
    done,
    remaining,
    days,
    daysLeft: overdue ? 0 : Math.max(0, calendarDaysInclusive(todayKey, due)),
    even,
    extra,
    todayExpected,
    overdue,
    notYet: beforeStart,
    due,
    start: windowStart,
    redistributed,
    custom: false,
    spreadTarget,
    baseDone,
    dayPlan: {},
  };
}

export function dailyPaceCopy(pace, ar = true) {
  if (!pace?.active) return null;
  if (pace.notYet) {
    return {
      tone: "ok",
      kicker: ar ? "لم يحن يومه" : "Its day has not come",
      metrics: [
        { label: ar ? "اليوم" : "Today", value: "—" },
        { label: ar ? "المستهدف" : "Target", value: String(pace.target) },
        { label: ar ? "الأيام" : "Days", value: String(pace.days) },
      ],
      hint: ar
        ? "التوزيع يبدأ من تاريخ البدء حتى الاستحقاق — لا حصة لليوم قبل ذلك."
        : "The spread runs from the start date to the due date — no quota today before then.",
    };
  }
  if (pace.remaining <= 0) {
    return {
      tone: "done",
      kicker: pace?.custom
        ? (ar ? "خطة أيام محددة" : "Custom day plan")
        : (ar ? "التوزيع على الأيام" : "Spread across days"),
      metrics: [
        { label: ar ? "اليوم" : "Today", value: "0" },
        { label: ar ? "المستهدف" : "Target", value: String(pace.target) },
        { label: ar ? "الأيام" : "Days", value: String(pace.days) },
      ],
      hint: ar ? "اكتمل العدد المستهدف" : "Target count is met",
    };
  }
  if (pace.overdue) {
    return {
      tone: "warn",
      kicker: pace?.custom
        ? (ar ? "خطة أيام — متأخر" : "Day plan — behind")
        : (ar ? "متأخر عن التوزيع" : "Behind the spread"),
      metrics: [
        { label: ar ? "اليوم" : "Today", value: String(pace.remaining) },
        { label: ar ? "المتبقي" : "Left", value: String(pace.remaining) },
        { label: ar ? "الأيام" : "Days", value: "0" },
      ],
      hint: ar ? "المتبقي يُنجز اليوم" : "Remaining is due today",
    };
  }
  return {
    tone: "ok",
    kicker: pace.custom
      ? (ar ? "خطة أيام محددة" : "Custom day plan")
      : (ar ? "التوزيع على الأيام" : "Spread across days"),
    metrics: [
      { label: ar ? "اليوم" : "Today", value: String(pace.todayExpected) },
      { label: ar ? "المستهدف" : "Target", value: String(pace.target) },
      { label: ar ? "الأيام" : "Days", value: String(pace.days) },
    ],
    hint: pace.custom
      ? (ar ? "حصة الأيام المحددة في الخطة — اليوم فقط إن وُجدت له كمية" : "Quota from the custom day plan — today only if scheduled")
      : pace.redistributed
        ? (ar ? "أُعيد توزيع المتبقي بالتساوي من يوم إعادة الضبط" : "Remainder re-split evenly from the rebaseline day")
        : (ar ? "يُقسَّم العدد بالتساوي من تاريخ البدء حتى الاستحقاق" : "The count is split evenly from the start date to the due date"),
  };
}

/** Units logged on a calendar day from paceDayLog. */
export function taskPaceLoggedOnDay(task, day = new Date()) {
  const key = isoDayKey(day);
  if (!key) return 0;
  const map = task?.paceDayLog && typeof task.paceDayLog === "object" ? task.paceDayLog : null;
  if (!map) return 0;
  return Math.max(0, Number(map[key]) || 0);
}

export function applyOpsPaceDayLog(task, amount = 1, at = new Date().toISOString()) {
  const day = isoDayKey(at);
  const add = Math.max(0, Math.round(Number(amount) || 0));
  const prev = task?.paceDayLog && typeof task.paceDayLog === "object" ? task.paceDayLog : {};
  const nextVal = Math.max(0, Number(prev[day]) || 0) + add;
  return {
    ...task,
    paceDayLog: { ...prev, [day]: nextVal },
  };
}

/** Open / derived pace blocker when today's quota is unmet. */
export function derivePaceBlocker({ task, pace, amountJustLogged = 0, today = new Date() } = {}) {
  if (!pace?.active || pace.overdue || pace.notYet) return null;
  const expected = Math.max(0, Number(pace.todayExpected) || 0);
  if (expected <= 0) return null;
  const day = isoDayKey(today);
  const stored = task?.paceBlocker && typeof task.paceBlocker === "object" ? task.paceBlocker : null;
  if (stored?.status === "resolved" && String(stored.day || "") === day) return null;

  const add = Math.max(0, Math.round(Number(amountJustLogged) || 0));
  const beforeToday = taskPaceLoggedOnDay(task, today);
  const logged = Math.max(0, beforeToday + add);
  if (logged >= expected) return null;

  const target = Math.max(1, Number(task?.targetCount) || pace?.target || 1);
  const done = Math.max(0, Number(task?.completedCount) || 0);
  const remainingAfter = Math.max(0, target - done - add);

  return {
    day,
    expected,
    logged,
    gap: expected - logged,
    remainingAfter,
    daysLeft: pace.daysLeft,
    due: pace.due || "",
    kind: logged <= 0 ? "missed" : "partial",
    status: "open",
  };
}

/** Compatibility wrapper — prefer derivePaceBlocker. */
export function derivePaceLogShortfall({ pace, amount, remainingBefore, task, today } = {}) {
  if (task) {
    return derivePaceBlocker({ task, pace, amountJustLogged: amount, today });
  }
  const remBefore = remainingBefore != null ? Number(remainingBefore) : pace?.remaining;
  const synthetic = {
    targetCount: pace?.target || 0,
    completedCount: Math.max(0, (Number(pace?.target) || 0) - Math.max(0, remBefore || 0)),
    paceDayLog: {},
  };
  return derivePaceBlocker({
    task: synthetic,
    pace,
    amountJustLogged: amount,
    today,
  });
}

export function paceShortfallCopy(shortfall, ar = true) {
  if (!shortfall) return null;
  // المنجز هو مصدر الحقيقة — لا تعتمد على kind المخزَّن إن تعارض
  const missed = Number(shortfall.logged) <= 0;
  return {
    caseKey: missed ? "missed" : "partial",
    caseLabel: missed
      ? (ar ? "حالة 1 — لم تُنجز من الأساس" : "Case 1 — not started today")
      : (ar ? "حالة 2 — أُنجزت جزئيًا" : "Case 2 — partially completed"),
    title: missed
      ? (ar ? "عائق — المهمة لم تُنجز اليوم" : "Blocker — nothing completed today")
      : (ar ? "عائق — إنجاز جزئي عن تارقت اليوم" : "Blocker — partial vs today's target"),
    reason: missed
      ? (ar
        ? `لم يُسجَّل أي إنجاز من حصة اليوم. التارقت ${shortfall.expected}، المنجز 0 (نقص ${shortfall.gap}). المتبقي على المهمة ${shortfall.remainingAfter} عبر ${shortfall.daysLeft} يوم حتى ${shortfall.due || "—"}.`
        : `Nothing was logged toward today's quota. Target ${shortfall.expected}, done 0 (short ${shortfall.gap}). Task remaining ${shortfall.remainingAfter} over ${shortfall.daysLeft} days until ${shortfall.due || "—"}.`)
      : (ar
        ? `أُنجز جزء من الحصة: ${shortfall.logged} من ${shortfall.expected} (نقص ${shortfall.gap}). المتبقي على المهمة ${shortfall.remainingAfter} عبر ${shortfall.daysLeft} يوم حتى ${shortfall.due || "—"}.`
        : `Part of the quota was done: ${shortfall.logged} of ${shortfall.expected} (short ${shortfall.gap}). Task remaining ${shortfall.remainingAfter} over ${shortfall.daysLeft} days until ${shortfall.due || "—"}.`),
    reasonLabel: missed
      ? (ar ? "سبب عدم إنجاز المهمة اليوم (مطلوب)" : "Reason nothing was completed today (required)")
      : (ar ? "سبب عدم إكمال الحصة اليوم (مطلوب)" : "Reason the quota was not finished today (required)"),
    reasonPlaceholder: missed
      ? (ar
        ? "مثال: لم يبدأ العمل، غياب الفريق، إيقاف الموقع…"
        : "e.g. work never started, team absent, site stopped…")
      : (ar
        ? "مثال: نقص عمالة، عطل معدة، انتظار اعتماد…"
        : "e.g. staffing gap, equipment fault, waiting approval…"),
    extendHint: ar
      ? "مدّد الموعد لإعطاء أيام إضافية للمتبقي."
      : "Extend the due date to add days for the remainder.",
    redistributeHint: ar
      ? "وزّع المتبقي بالتساوي على الأيام المتبقية بدءًا من اليوم."
      : "Distribute the remainder evenly across remaining days from today.",
    choiceHint: ar
      ? "حالتان للعائق: (1) لم تُنجز من الأساس (2) أُنجزت جزئيًا — اكتب السبب ثم تمديد الأيام أو التوزيع."
      : "Two blocker cases: (1) not started (2) partial — write the reason, then extend days or redistribute.",
  };
}

export function applyOpsPaceBlockerResolve(task, input = {}) {
  const at = input.at || new Date().toISOString();
  const day = isoDayKey(input.day || at);
  const reason = String(input.reason || "").trim();
  const resolution = input.resolution === "extend" ? "extend" : "redistribute";
  const prev = task?.paceBlocker && typeof task.paceBlocker === "object" ? task.paceBlocker : {};
  return {
    ...task,
    paceBlocker: {
      ...prev,
      day,
      expected: Number(input.expected != null ? input.expected : prev.expected) || 0,
      logged: Number(input.logged != null ? input.logged : prev.logged) || 0,
      gap: Number(input.gap != null ? input.gap : prev.gap) || 0,
      reason,
      resolution,
      status: "resolved",
      resolvedAt: at,
      byId: input.byId || null,
      byName: input.byName || "",
    },
  };
}

export function boardPaceCopy(board, ar = true) {
  if (!board?.active) return null;
  return {
    tone: "ok",
    kicker: ar ? "التوزيع على الأيام" : "Spread across days",
    metrics: [
      { label: ar ? "اليوم" : "Today", value: String(board.todayExpected) },
      { label: ar ? "الأوامر" : "Orders", value: String(board.active) },
    ],
    hint: ar ? "مجموع إيقاع اليوم للأوامر المؤرخة" : "Sum of today's pace on dated orders",
  };
}

export function dailyPaceLabel(pace, ar = true) {
  const copy = dailyPaceCopy(pace, ar);
  if (!copy) return "";
  const today = copy.metrics[0]?.value || "0";
  return `${copy.kicker} · ${today} · ${copy.hint}`;
}

export function deriveBoardDailyPace(tasks, today = new Date()) {
  let todayExpected = 0;
  let active = 0;
  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    if (isDone(task) || isAwaitingApproval(task)) return;
    const pace = deriveDailyTaskPace({
      targetCount: task.targetCount,
      completedCount: task.completedCount,
      dueAt: task.dueAt,
      startAt: task.startAt || task.createdAt,
      paceStartAt: task.paceStartAt,
      paceSpreadTarget: task.paceSpreadTarget,
      paceDayPlan: task.paceDayPlan,
      today,
    });
    if (!pace.active) return;
    active += 1;
    todayExpected += pace.todayExpected;
  });
  return { active, todayExpected };
}

/** Remaining days to due date: ≤7 weekly, ≤31 monthly, ≤92 quarterly, ≤183 half-year, else annual. */
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

/** Live plan bucket from remaining days. A pinned horizon stays only when explicitly pinned. */
export function taskPlanHorizon(task, today = new Date()) {
  if (task?.planPinned && task?.planHorizon) return String(task.planHorizon);
  return planHorizonFromDue(task?.dueAt, today);
}

export function isOverdue(task, today = new Date()) {
  if (!task.dueAt) return false;
  if (task.status === "completed" || task.approvedAt) return false;
  return dayDiffFromToday(task.dueAt, today) < 0;
}

export function isDueToday(task, today = new Date()) {
  if (!task.dueAt) return false;
  return dayDiffFromToday(task.dueAt, today) === 0;
}

export function isAwaitingApproval(task) {
  if (task.status === "awaiting_approval" || task.status === "pending_review") return true;
  const done = Number(task.completedCount) || 0;
  const target = Math.max(1, Number(task.targetCount) || 1);
  return done >= target && !task.approvedAt && task.status !== "completed";
}

export function isDone(task) {
  return task.status === "completed" || !!task.approvedAt;
}

export function isEscalated(task) {
  return (Number(task?.escalationLevel) || 0) > 0 && !isDone(task);
}

/** Fallback ladder when the company has no custom HR tiers. */
export const OPS_ROLE_LADDER = ["station_manager", "pgm", "ops_manager", "director", "owner"];

function personId(p) {
  return p?.id || p?.employeeId || null;
}

function opsHrGroups(data) {
  const levels = Array.isArray(data?.hrLevels) ? data.hrLevels : [];
  const orders = [...new Set(levels.map((l) => l.order))].sort((a, b) => a - b);
  return orders
    .map((order) => ({
      order,
      scope: levels.find((l) => l.order === order)?.scope || "company",
      manager: levels.find((l) => l.order === order && l.role === "manager") || null,
    }))
    .filter((g) => g.manager && g.manager.active !== false);
}

export function opsStageCount(data, stationId) {
  const branch = deriveBranchEscalationChain(stationId || null, data);
  if (branch.length) return branch.length;
  const hr = opsHrGroups(data).length;
  return hr > 0 ? hr + 1 : OPS_ROLE_LADDER.length;
}

export function opsHandlersAt(levelIdx, task, data) {
  const employees = Array.isArray(data?.employees) ? data.employees : [];
  const stationId = task?.stationId || null;
  const branch = deriveBranchEscalationChain(stationId, data);
  if (branch.length) {
    const step = branch[levelIdx];
    if (!step) return [];
    return employees.filter((e) => String(e.id || e.employeeId) === String(step.employeeId));
  }
  const groups = opsHrGroups(data);
  if (groups.length) {
    if (levelIdx === 0) {
      return employees.filter((e) => (
        e.role === "station_manager"
        && userCoversStation(e, data, stationId)
      ));
    }
    const group = groups[levelIdx - 1];
    if (!group?.manager) return [];
    return employees.filter((e) => {
      if (e.hrLevelId !== group.manager.id) return false;
      if (group.manager.stationIds?.length && stationId && !group.manager.stationIds.includes(stationId)) return false;
      if (group.scope === "station") return e.hrStationId === stationId;
      if (group.scope === "cluster") {
        const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(stationId));
        return cluster ? e.hrClusterId === cluster.id : false;
      }
      return true;
    });
  }
  const role = OPS_ROLE_LADDER[levelIdx];
  if (!role) return [];
  return employees.filter((e) => {
    const isOwner = e.role === "owner" || e.isOwner;
    if (role === "owner") return isOwner;
    if (e.role !== role) return false;
    if (role === "station_manager") {
      return !stationId || userCoversStation(e, data, stationId);
    }
    return true;
  });
}

export function nextOpsEscalation(task, data, rejecterId) {
  const current = Math.max(0, Number(task?.escalationLevel) || 0);
  const stages = opsStageCount(data, task?.stationId);
  for (let lvl = current + 1; lvl < stages; lvl += 1) {
    const handlers = opsHandlersAt(lvl, task, data);
    const others = rejecterId
      ? handlers.filter((h) => String(personId(h)) !== String(rejecterId))
      : handlers;
    if (others.length) {
      return { escalate: true, nextLevel: lvl, handlers: others, atTop: false };
    }
  }
  return { escalate: false, nextLevel: current, handlers: [], atTop: true };
}

export function checkRejectReasonGate(reason, lang = "ar") {
  if (!String(reason || "").trim()) {
    return {
      ok: false,
      error: "REASON_REQUIRED",
      reason: lang === "ar" ? "اكتب سبب الرفض — لا رفض بلا سبب مكتوب." : "Write a rejection reason — no silent reject.",
    };
  }
  return { ok: true };
}

export function applyOpsReject(task, { reason, escalate, nextLevel, reviewerId, reviewerName, now } = {}) {
  const at = now || new Date().toISOString();
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const entry = {
    id: `rej_${at}`,
    authorId: reviewerId || null,
    authorName: reviewerName || "",
    text: String(reason || "").trim(),
    isIssue: false,
    is_rejection: true,
    is_escalation: !!escalate,
    at,
  };
  if (escalate) {
    return {
      ...task,
      status: "awaiting_approval",
      escalationLevel: nextLevel,
      rejectReason: entry.text,
      escalatedAt: at,
      comments: [...comments, entry],
    };
  }
  return {
    ...task,
    status: "active",
    completedCount: Math.max(0, (Number(task.completedCount) || 0) - 1),
    rejectReason: entry.text,
    comments: [...comments, entry],
    approvedAt: null,
  };
}

export function canReviewOpsTask(task, user, data) {
  if (!user || !task || isDone(task)) return false;
  if (user.isOwner || user.admin || user.role === "owner" || user.role === "admin") return true;
  const uid = String(user.id || user.employeeId || "");
  const branch = deriveBranchEscalationChain(task.stationId, data);
  if (branch.length && uid) {
    const level = Math.max(0, Number(task.escalationLevel) || 0);
    return branch.slice(level).some((s) => String(s.employeeId) === uid);
  }
  const level = Math.max(0, Number(task.escalationLevel) || 0);
  const handlers = opsHandlersAt(level, task, data);
  if (uid && handlers.some((h) => String(personId(h)) === uid)) return true;
  const role = user.role;
  if (level === 0 && ["director", "ops_manager", "station_manager", "pgm"].includes(role)) {
    if (role === "station_manager") {
      return !task.stationId || userCoversStation(user, data, task.stationId);
    }
    return true;
  }
  if (level > 0 && ["director", "ops_manager", "pgm"].includes(role)) return true;
  return false;
}

export function deriveOpsCounts(tasks, today = new Date()) {
  const list = Array.isArray(tasks) ? tasks : [];
  const done = list.filter(isDone).length;
  const overdue = list.filter((t) => isOverdue(t, today)).length;
  const dueToday = list.filter((t) => isDueToday(t, today)).length;
  const awaiting = list.filter(isAwaitingApproval).length;
  const escalated = list.filter(isEscalated).length;
  return {
    total: list.length,
    done,
    overdue,
    today: dueToday,
    awaiting,
    escalated,
    active: Math.max(0, list.length - done),
    badge: overdue + awaiting,
    pointsAwarded: list.reduce((n, t) => n + (Number(t.pointsAwarded) || 0), 0),
  };
}

export function deriveHorizonGroups(tasks, today = new Date()) {
  const order = ["y", "h", "q", "m", "w"];
  const list = Array.isArray(tasks) ? tasks : [];
  return order.map((id) => {
    const rows = list.filter((t) => taskPlanHorizon(t, today) === id);
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

export function certCodeOf(cert) {
  if (!cert) return "";
  const raw = String(cert.code || cert.kind || cert.certCode || cert.category || cert.name || "").toLowerCase();
  if (["fa", "first_aid", "first-aid", "إسعاف"].some((k) => raw.includes(k.replace("_", "")))) return "fa";
  if (raw.includes("loto") || raw.includes("عزل")) return "loto";
  if (raw.includes("wah") || raw.includes("ارتفاع") || raw.includes("height")) return "wah";
  if (raw.includes("cs") || raw.includes("محصور") || raw.includes("confined")) return "cs";
  if (CERT_FOR[raw] !== undefined || CERT_LABELS[raw]) return raw;
  return raw;
}

export function certIsCurrent(cert, today = new Date()) {
  if (!cert) return false;
  const status = String(cert.status || "approved").toLowerCase();
  if (status === "rejected" || status === "pending" || status === "expired") return false;
  const exp = cert.expiryDate || cert.expiresAt || cert.exp || cert.validUntil;
  if (!exp) return status === "approved" || status === "valid" || status === "active" || !cert.status;
  const end = new Date(`${String(exp).slice(0, 10)}T23:59:59`);
  return !Number.isNaN(end.getTime()) && end.getTime() >= localDayStart(today).getTime();
}

export function employeeLacksCert(employee, required, today = new Date()) {
  if (!required) return false;
  const certs = Array.isArray(employee?.certificates) ? employee.certificates : [];
  return !certs.some((c) => certCodeOf(c) === required && certIsCurrent(c, today));
}

/**
 * Assignment gate (same rules as server). Validates that an owner/team exists
 * in the company. Expired competency certificates are informational only.
 */
export function checkAssignGate(input) {
  const required = CERT_FOR[input.workKind] ?? null;
  const lang = input.lang === "en" ? "en" : "ar";
  if (!required) return { ok: true, required: null, blocked: [] };

  const label = CERT_LABELS[required]?.[lang] || required;
  const byId = new Map();
  for (const p of input.people || []) {
    if (p.employeeId) byId.set(String(p.employeeId), p);
    if (p.id) byId.set(String(p.id), p);
  }

  if (input.assignMode === "one") {
    if (!input.ownerId) {
      return {
        ok: false,
        required,
        blocked: [],
        reason: lang === "ar" ? "لا يمكن الإسناد: لم يُحدَّد مسؤول." : "Cannot assign: no owner selected.",
        certLabel: label,
      };
    }
    if (!byId.get(input.ownerId)) {
      return {
        ok: false,
        required,
        blocked: [],
        reason: lang === "ar"
          ? "لا يمكن الإسناد: المسؤول ليس ضمن موظفي هذه الشركة."
          : "Cannot assign: owner is not an employee of this company.",
        certLabel: label,
      };
    }
  } else if (input.assignMode === "some") {
    const ids = input.memberIds || [];
    if (!ids.length) {
      return {
        ok: false,
        required,
        blocked: [],
        reason: lang === "ar" ? "لا يمكن الإسناد: لم يُختَر أحد من الفريق." : "Cannot assign: no team members selected.",
        certLabel: label,
      };
    }
    if (ids.some((id) => !byId.has(id))) {
      return {
        ok: false,
        required,
        blocked: [],
        reason: lang === "ar"
          ? "لا يمكن الإسناد: أحد المحددين ليس ضمن موظفي هذه الشركة."
          : "Cannot assign: a selected member is not an employee of this company.",
        certLabel: label,
      };
    }
  } else if (!input.people.length) {
    return {
      ok: false,
      required,
      blocked: [],
      reason: lang === "ar" ? "لا يمكن الإسناد: لا طاقم في هذا الفرع." : "Cannot assign: no crew at this station.",
      certLabel: label,
    };
  }

  return { ok: true, required, blocked: [], certLabel: label };
}

export function taskAssigneeId(task) {
  return task?.ownerId || task?.employee_id || task?.assignedTo || null;
}

export function latestAssignment(task) {
  const hist = Array.isArray(task?.assignmentHistory) ? task.assignmentHistory : [];
  return hist.length ? hist[hist.length - 1] : null;
}

/** YYYY-MM-DD for the latest delegation start, if any. */
export function taskDelegatedAt(task) {
  const direct = String(task?.delegatedAt || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  const entry = latestOpenDelegation(task) || latestAssignment(task);
  const fromEntry = String(entry?.delegatedAt || entry?.at || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(fromEntry) ? fromEntry : "";
}

/** Last delegate/acting entry that has not been closed by a following end. */
export function latestOpenDelegation(task) {
  const hist = Array.isArray(task?.assignmentHistory) ? task.assignmentHistory : [];
  for (let i = hist.length - 1; i >= 0; i -= 1) {
    const e = hist[i];
    if (!e) continue;
    if (e.kind === "end") return null;
    if (e.kind === "transfer") return null;
    if (e.kind === "delegate" || e.kind === "acting" || e.delegatedAt) return e;
  }
  return null;
}

/** Reference block for the task card: start, planned end, actual end, parties. */
export function taskDelegationMeta(task) {
  const hist = Array.isArray(task?.assignmentHistory) ? task.assignmentHistory : [];
  let open = null;
  let ended = null;
  for (let i = hist.length - 1; i >= 0; i -= 1) {
    const e = hist[i];
    if (!e) continue;
    if (!ended && e.kind === "end") {
      ended = e;
      continue;
    }
    if (!open && (e.kind === "delegate" || e.kind === "acting" || (e.delegatedAt && e.kind !== "transfer" && e.kind !== "end"))) {
      open = e;
      break;
    }
  }
  if (!open && !task?.delegatedAt && !ended) return null;
  const start = String(task?.delegatedAt || open?.delegatedAt || open?.at || ended?.delegatedAt || "").slice(0, 10);
  const end = String(task?.actingUntil || open?.actingUntil || ended?.actingUntil || "").slice(0, 10);
  const endedAt = String(task?.delegationEndedAt || ended?.endedAt || (ended ? String(ended.at || "").slice(0, 10) : "") || "").slice(0, 10);
  const active = !!(start && !endedAt && task?.delegationActive !== false && latestOpenDelegation(task));
  return {
    start: /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : "",
    end: /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : "",
    endedAt: /^\d{4}-\d{2}-\d{2}$/.test(endedAt) ? endedAt : "",
    active,
    byId: task?.delegationById || open?.byId || null,
    byName: task?.delegationByName || open?.byName || ended?.byName || "",
    fromId: open?.fromId || task?.originalOwnerId || null,
    fromName: open?.fromName || "",
    toId: open?.toId || null,
    toName: open?.toName || task?.ownerName || "",
    reason: open?.reason || "",
  };
}

export function assignmentHistoryNote(entry, lang = "ar") {
  if (!entry) return "";
  const from = entry.fromName || "—";
  const to = entry.toName || "—";
  const reason = String(entry.reason || "").trim();
  const kind = entry.kind === "transfer"
    ? "transfer"
    : (entry.kind === "acting" ? "acting" : (entry.kind === "end" ? "end" : "delegate"));
  const until = entry.actingUntil ? String(entry.actingUntil).slice(0, 10) : "";
  const when = String(entry.delegatedAt || entry.transferredAt || entry.at || "").slice(0, 10);
  const ended = String(entry.endedAt || (kind === "end" ? entry.at : "") || "").slice(0, 10);
  if (lang === "en") {
    if (kind === "end") {
      const base = reason
        ? `Delegation ended — returned from ${from} to ${to} — ${reason}`
        : `Delegation ended — returned from ${from} to ${to}`;
      return ended ? `${base} · ${ended}` : base;
    }
  if (kind === "transfer") {
    const base = reason
      ? `Ownership transferred from ${from} to ${to} — ${reason}`
      : `Ownership transferred from ${from} to ${to}`;
    const by = entry.byName ? ` · by ${entry.byName}` : "";
    return when ? `${base}${by} · ${when}` : `${base}${by}`;
  }
    if (kind === "acting" || kind === "delegate") {
      const base = reason
        ? `Delegated from ${from} to ${to} — ${reason}`
        : `Delegated from ${from} to ${to}`;
      const range = when && until ? `${when} → ${until}` : (when || until);
      return range ? `${base} · ${range}` : base;
    }
    return reason ? `Delegated from ${from} to ${to} — ${reason}` : `Delegated from ${from} to ${to}`;
  }
  if (kind === "end") {
    const base = reason
      ? `أُنهيت الوكالة — عادت من ${from} إلى ${to} — ${reason}`
      : `أُنهيت الوكالة — عادت من ${from} إلى ${to}`;
    return ended ? `${base} · ${ended}` : base;
  }
  if (kind === "transfer") {
    const base = reason
      ? `نُقلت الملكية من ${from} إلى ${to} — ${reason}`
      : `نُقلت الملكية من ${from} إلى ${to}`;
    const by = entry.byName ? ` · بواسطة ${entry.byName}` : "";
    return when ? `${base}${by} · ${when}` : `${base}${by}`;
  }
  if (kind === "acting" || kind === "delegate") {
    const base = reason
      ? `وُكِّل من ${from} إلى ${to} — ${reason}`
      : `وُكِّل من ${from} إلى ${to}`;
    const range = when && until ? `${when} → ${until}` : (when || until);
    return range ? `${base} · ${range}` : base;
  }
  return reason ? `وُكِّل من ${from} إلى ${to} — ${reason}` : `وُكِّل من ${from} إلى ${to}`;
}

/** Manager-only توكيل. Closed / approved / awaiting-review tasks stay on the proof chain. */
export function canReassignOpsTask(task, user, data) {
  if (!user || !task) return false;
  if (isDone(task) || isAwaitingApproval(task)) return false;
  const mode = task.assignMode || "one";
  if (mode !== "one" && !taskAssigneeId(task)) return false;
  const uid = user.id || user.employeeId;
  const isOwner = user.role === "owner" || user.isOwner || user.admin
    || (data?.ownerId && uid && String(uid) === String(data.ownerId));
  if (isOwner) return true;
  if (!["director", "ops_manager", "pgm", "station_manager"].includes(user.role)) return false;
  if (user.role === "station_manager") {
    const sid = task.stationId;
    if (!sid) return true;
    if (userCoversStation(user, data, sid)) return true;
    return (data?.stations || []).some((s) => {
      const id = s.id || s.stationId;
      return id === sid && uid && s.managerId && String(s.managerId) === String(uid);
    });
  }
  return true;
}

export function checkReassignGate(input) {
  const lang = input.lang === "en" ? "en" : "ar";
  const task = input.task;
  const user = input.user;
  const toId = String(input.toId || "").trim();
  const reason = String(input.reason || "").trim();
  const kind = input.kind === "transfer"
    ? "transfer"
    : (input.kind === "acting" ? "acting" : "delegate");
  const actingUntilRaw = String(input.actingUntil || "").trim().slice(0, 10);
  const actingUntil = /^\d{4}-\d{2}-\d{2}$/.test(actingUntilRaw) ? actingUntilRaw : "";
  const delegatedAtRaw = String(input.delegatedAt || "").trim().slice(0, 10);
  const delegatedAt = /^\d{4}-\d{2}-\d{2}$/.test(delegatedAtRaw) ? delegatedAtRaw : "";
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (!canReassignOpsTask(task, user, input.data)) {
    return {
      ok: false,
      error: "REASSIGN_FORBIDDEN",
      reason: lang === "ar"
        ? "التوكيل للمدير فقط — وبعد الإنجاز أو الاعتماد لا يُعاد إسناد المهمة."
        : "Only a manager can delegate, and a completed or approved task cannot be reassigned.",
    };
  }
  if (!reason) {
    return {
      ok: false,
      error: "REASON_REQUIRED",
      reason: lang === "ar"
        ? "اكتب سبب التوكيل أو النقل."
        : "Write why the task is being reassigned.",
    };
  }
  if (!toId) {
    return {
      ok: false,
      error: "ASSIGNEE_REQUIRED",
      reason: lang === "ar" ? "اختر الموظف المستلم." : "Pick the receiving employee.",
    };
  }
  if (kind !== "transfer" && !delegatedAt) {
    return {
      ok: false,
      error: "DELEGATED_AT_REQUIRED",
      reason: lang === "ar"
        ? "حدّد بداية التوكيل."
        : "Set when the delegation starts.",
    };
  }
  if (kind === "transfer" && !delegatedAt) {
    return {
      ok: false,
      error: "TRANSFER_DATE_REQUIRED",
      reason: lang === "ar"
        ? "حدّد تاريخ النقل."
        : "Set the transfer date.",
    };
  }
  if (kind !== "transfer" && !actingUntil) {
    return {
      ok: false,
      error: "ACTING_UNTIL_REQUIRED",
      reason: lang === "ar"
        ? "حدّد نهاية التوكيل."
        : "Set when the delegation ends.",
    };
  }
  if (kind !== "transfer" && delegatedAt && actingUntil && actingUntil < delegatedAt) {
    return {
      ok: false,
      error: "ACTING_UNTIL_INVALID",
      reason: lang === "ar"
        ? "نهاية التوكيل يجب أن تكون في يوم البداية أو بعده."
        : "Delegation end must be on or after the start date.",
    };
  }
  if (kind !== "transfer" && actingUntil && actingUntil < todayKey) {
    return {
      ok: false,
      error: "ACTING_UNTIL_INVALID",
      reason: lang === "ar"
        ? "نهاية التوكيل يجب أن تكون اليوم أو لاحقًا."
        : "Delegation end must be today or later.",
    };
  }
  const fromId = String(taskAssigneeId(task) || "");
  if (fromId && fromId === toId) {
    return {
      ok: false,
      error: "SELF_REASSIGN_FORBIDDEN",
      reason: lang === "ar" ? "لا توكيل إلى نفس المسؤول الحالي." : "Cannot delegate to the current assignee.",
    };
  }
  const people = Array.isArray(input.people) ? input.people : [];
  if (people.length && !people.some((p) => String(p.employeeId || p.id) === toId)) {
    return {
      ok: false,
      error: "ASSIGNEE_OUT_OF_SCOPE",
      reason: lang === "ar"
        ? "الموظف المختار خارج نطاق الفرع الظاهر."
        : "Selected employee is outside the visible station scope.",
    };
  }
  return {
    ok: true,
    kind,
    delegatedAt,
    actingUntil: kind === "transfer" ? "" : actingUntil,
    fromId: fromId || null,
    toId,
  };
}

export function applyOpsReassign(task, input = {}) {
  const delegatedAtRaw = String(input.delegatedAt || input.at || "").trim().slice(0, 10);
  const delegatedAt = /^\d{4}-\d{2}-\d{2}$/.test(delegatedAtRaw)
    ? delegatedAtRaw
    : new Date().toISOString().slice(0, 10);
  const at = input.at && String(input.at).includes("T")
    ? String(input.at)
    : `${delegatedAt}T12:00:00.000Z`;
  const fromId = input.fromId || taskAssigneeId(task) || null;
  const toId = input.toId;
  const reason = String(input.reason || "").trim();
  const kind = input.kind === "transfer"
    ? "transfer"
    : (input.kind === "acting" ? "acting" : "delegate");
  const untilRaw = String(input.actingUntil || "").trim().slice(0, 10);
  const actingUntil = kind !== "transfer" && /^\d{4}-\d{2}-\d{2}$/.test(untilRaw) ? untilRaw : "";
  const entry = {
    fromId,
    toId,
    byId: input.byId || null,
    reason,
    at,
    kind,
    delegatedAt: kind === "transfer" ? null : delegatedAt,
    transferredAt: kind === "transfer" ? delegatedAt : null,
    actingUntil: actingUntil || null,
    fromName: input.fromName || "",
    toName: input.toName || "",
    byName: input.byName || "",
  };
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const note = assignmentHistoryNote(entry, input.lang === "en" ? "en" : "ar");
  const base = {
    ...task,
    ownerId: toId,
    assignedTo: toId,
    employee_id: toId,
    ownerName: entry.toName || task.ownerName,
    assignmentHistory: [...(Array.isArray(task.assignmentHistory) ? task.assignmentHistory : []), entry],
    actionLog: [
      ...(Array.isArray(task.actionLog) ? task.actionLog : []),
      {
        id: `act_${at}`,
        type: kind === "transfer" ? "ownership_transfer" : (kind === "acting" ? "acting" : "delegate"),
        at,
        byId: entry.byId,
        byName: entry.byName,
        fromId,
        toId,
        fromName: entry.fromName,
        toName: entry.toName,
        reason,
        delegatedAt: entry.delegatedAt,
        transferredAt: entry.transferredAt,
        actingUntil: actingUntil || null,
      },
    ],
    comments: [...comments, {
      id: `reassign_${at}`,
      authorId: entry.byId,
      authorName: entry.byName,
      text: note,
      isIssue: false,
      is_reassignment: true,
      at,
      delegatedAt: entry.delegatedAt,
      transferredAt: entry.transferredAt,
      actingUntil: actingUntil || null,
    }],
  };
  if (kind === "transfer") {
    return {
      ...base,
      // Permanent ownership — new owner is the proof owner going forward.
      originalOwnerId: toId,
      assignmentKind: "transfer",
      transferredAt: delegatedAt,
      transferredById: input.byId || null,
      transferredByName: input.byName || "",
      delegatedAt: null,
      actingUntil: null,
      delegationActive: false,
      delegationEndedAt: null,
      delegationById: null,
      delegationByName: null,
    };
  }
  return {
    ...base,
    originalOwnerId: task.originalOwnerId || fromId,
    assignmentKind: kind,
    delegatedAt,
    actingUntil: actingUntil || null,
    delegationActive: true,
    delegationEndedAt: null,
    delegationById: input.byId || null,
    delegationByName: input.byName || "",
    transferredAt: task.transferredAt || null,
    transferredById: task.transferredById || null,
    transferredByName: task.transferredByName || null,
  };
}

/** Latest permanent ownership transfer — reference on the task card. */
export function taskTransferMeta(task) {
  const hist = Array.isArray(task?.assignmentHistory) ? task.assignmentHistory : [];
  let entry = null;
  for (let i = hist.length - 1; i >= 0; i -= 1) {
    if (hist[i]?.kind === "transfer") {
      entry = hist[i];
      break;
    }
  }
  const at = String(task?.transferredAt || entry?.transferredAt || entry?.at || "").slice(0, 10);
  if (!entry && !/^\d{4}-\d{2}-\d{2}$/.test(at) && task?.assignmentKind !== "transfer") return null;
  return {
    at: /^\d{4}-\d{2}-\d{2}$/.test(at) ? at : "",
    byId: task?.transferredById || entry?.byId || null,
    byName: task?.transferredByName || entry?.byName || "",
    fromId: entry?.fromId || null,
    fromName: entry?.fromName || "",
    toId: entry?.toId || task?.ownerId || null,
    toName: entry?.toName || task?.ownerName || "",
    reason: entry?.reason || "",
  };
}

/** الموكِّل (who recorded the open delegation) may end it; managers may too. */
export function canEndOpsDelegation(task, user, data) {
  if (!user || !task) return false;
  if (isDone(task) || isAwaitingApproval(task)) return false;
  const meta = taskDelegationMeta(task);
  if (!meta?.active) return false;
  const uid = String(user.id || user.employeeId || "");
  if (!uid) return false;
  if (meta.byId && String(meta.byId) === uid) return true;
  if (meta.fromId && String(meta.fromId) === uid) return true;
  if (task.originalOwnerId && String(task.originalOwnerId) === uid) return true;
  return canReassignOpsTask(task, user, data);
}

export function checkEndDelegationGate(input) {
  const lang = input.lang === "en" ? "en" : "ar";
  const reason = String(input.reason || "").trim();
  if (!canEndOpsDelegation(input.task, input.user, input.data)) {
    return {
      ok: false,
      error: "END_DELEGATION_FORBIDDEN",
      reason: lang === "ar"
        ? "إنهاء الوكالة للموكِّل أو المدير فقط، وعلى وكالة نشطة."
        : "Only the delegator or a manager can end an active delegation.",
    };
  }
  if (!reason) {
    return {
      ok: false,
      error: "REASON_REQUIRED",
      reason: lang === "ar" ? "اكتب سبب إنهاء الوكالة." : "Write why the delegation is ending.",
    };
  }
  const meta = taskDelegationMeta(input.task);
  const restoreId = String(meta?.fromId || input.task?.originalOwnerId || "").trim();
  if (!restoreId) {
    return {
      ok: false,
      error: "RESTORE_OWNER_MISSING",
      reason: lang === "ar"
        ? "لا يمكن إرجاع المهمة — المالك الأصلي غير معروف."
        : "Cannot restore the task — original owner is unknown.",
    };
  }
  return { ok: true, restoreId, meta };
}

export function applyOpsEndDelegation(task, input = {}) {
  const meta = taskDelegationMeta(task) || {};
  const restoreId = String(input.restoreId || meta.fromId || task.originalOwnerId || "").trim();
  const endedAtRaw = String(input.endedAt || "").trim().slice(0, 10);
  const endedAt = /^\d{4}-\d{2}-\d{2}$/.test(endedAtRaw)
    ? endedAtRaw
    : new Date().toISOString().slice(0, 10);
  const at = `${endedAt}T12:00:00.000Z`;
  const fromId = taskAssigneeId(task);
  const reason = String(input.reason || "").trim();
  const entry = {
    fromId,
    toId: restoreId,
    byId: input.byId || null,
    reason,
    at,
    kind: "end",
    delegatedAt: meta.start || task.delegatedAt || null,
    actingUntil: meta.end || task.actingUntil || null,
    endedAt,
    fromName: input.fromName || meta.toName || task.ownerName || "",
    toName: input.toName || meta.fromName || "",
    byName: input.byName || "",
  };
  const note = assignmentHistoryNote(entry, input.lang === "en" ? "en" : "ar");
  const comments = Array.isArray(task.comments) ? task.comments : [];
  return {
    ...task,
    ownerId: restoreId,
    assignedTo: restoreId,
    employee_id: restoreId,
    ownerName: entry.toName || task.ownerName,
    assignmentKind: null,
    delegationActive: false,
    delegationEndedAt: endedAt,
    // Keep start/end as reference on the card
    delegatedAt: meta.start || task.delegatedAt || null,
    actingUntil: meta.end || task.actingUntil || null,
    assignmentHistory: [...(Array.isArray(task.assignmentHistory) ? task.assignmentHistory : []), entry],
    actionLog: [
      ...(Array.isArray(task.actionLog) ? task.actionLog : []),
      {
        id: `end_deleg_${at}`,
        type: "end_delegation",
        at,
        byId: entry.byId,
        byName: entry.byName,
        fromId,
        toId: restoreId,
        fromName: entry.fromName,
        toName: entry.toName,
        reason,
        delegatedAt: entry.delegatedAt,
        actingUntil: entry.actingUntil,
        endedAt,
      },
    ],
    comments: [...comments, {
      id: `end_deleg_${at}`,
      authorId: entry.byId,
      authorName: entry.byName,
      text: note,
      isIssue: false,
      is_reassignment: true,
      at,
      endedAt,
    }],
  };
}

/** Soft-delete / undo within a short window after create or last action. */
export function canUndoOpsAction(task, { now = Date.now(), windowMs = 3 * 60 * 1000 } = {}) {
  if (!task) return false;
  const created = new Date(task.createdAt || task.created_date || 0).getTime();
  if (Number.isFinite(created) && now - created <= windowMs && !(task.completedCount > 0) && !task.approvedAt) {
    return { ok: true, target: "create" };
  }
  const log = Array.isArray(task.actionLog) ? task.actionLog : [];
  const last = log[log.length - 1];
  if (!last) return false;
  const at = new Date(last.at || 0).getTime();
  if (!Number.isFinite(at) || now - at > windowMs) return false;
  if (["acting", "extend", "comment", "blocker", "delegate"].includes(last.type)) {
    return { ok: true, target: last.type, entry: last };
  }
  return false;
}

export function applyOpsExtendDue(task, input = {}) {
  const at = input.at || new Date().toISOString();
  const nextDue = String(input.dueAt || "").trim();
  const reason = String(input.reason || "").trim();
  let next = {
    ...task,
    dueAt: nextDue || task.dueAt,
    actionLog: [
      ...(Array.isArray(task.actionLog) ? task.actionLog : []),
      {
        id: `ext_${at}`,
        type: "extend",
        at,
        byId: input.byId || null,
        byName: input.byName || "",
        fromDue: task.dueAt || null,
        toDue: nextDue || null,
        reason,
      },
    ],
    comments: [
      ...(Array.isArray(task.comments) ? task.comments : []),
      {
        id: `ext_c_${at}`,
        authorId: input.byId || null,
        authorName: input.byName || "",
        text: input.lang === "en"
          ? `Blocker · due extended to ${nextDue || "—"} — ${reason || "blocker"}`
          : `عائق · مُدّد الموعد إلى ${nextDue || "—"} — ${reason || "عائق"}`,
        isIssue: true,
        at,
      },
    ],
  };
  if (input.resolveBlocker !== false && reason) {
    next = applyOpsPaceBlockerResolve(next, {
      ...input,
      at,
      reason,
      resolution: "extend",
      day: input.blockerDay || input.day,
      expected: input.expected,
      logged: input.logged,
      gap: input.gap,
    });
  }
  return next;
}

/** Re-split current remaining count evenly from today through due. */
export function applyOpsRedistributeRemaining(task, input = {}) {
  const at = input.at || new Date().toISOString();
  const today = isoDayKey(input.paceStartAt || at);
  const target = Math.max(1, Number(task.targetCount) || 1);
  const done = Math.max(0, Number(task.completedCount) || 0);
  const remaining = Math.max(0, target - done);
  const reason = String(input.reason || "").trim();
  let next = {
    ...task,
    paceStartAt: today,
    paceSpreadTarget: remaining,
    paceDayPlan: {},
    actionLog: [
      ...(Array.isArray(task.actionLog) ? task.actionLog : []),
      {
        id: `pace_${at}`,
        type: "redistribute_pace",
        at,
        byId: input.byId || null,
        byName: input.byName || "",
        paceStartAt: today,
        paceSpreadTarget: remaining,
        reason,
      },
    ],
    comments: [
      ...(Array.isArray(task.comments) ? task.comments : []),
      {
        id: `pace_c_${at}`,
        authorId: input.byId || null,
        authorName: input.byName || "",
        text: input.lang === "en"
          ? `Blocker · remainder ${remaining} re-split from ${today} — ${reason || "partial pace"}`
          : `عائق · وُزِّع المتبقي ${remaining} من ${today} — ${reason || "إنجاز جزئي عن الإيقاع"}`,
        isIssue: true,
        at,
      },
    ],
  };
  if (input.resolveBlocker !== false && reason) {
    next = applyOpsPaceBlockerResolve(next, {
      ...input,
      at,
      reason,
      resolution: "redistribute",
      day: input.blockerDay || input.day || today,
      expected: input.expected,
      logged: input.logged,
      gap: input.gap,
    });
  }
  return next;
}

export function applyOpsSoftDelete(task, input = {}) {
  const at = input.at || new Date().toISOString();
  return {
    ...task,
    status: "cancelled",
    deletedAt: at,
    deletedBy: input.byId || null,
    actionLog: [
      ...(Array.isArray(task.actionLog) ? task.actionLog : []),
      {
        id: `del_${at}`,
        type: "undo_create",
        at,
        byId: input.byId || null,
        byName: input.byName || "",
      },
    ],
  };
}

/** Riyadh calendar day for escalation sweeps (Asia/Riyadh). */
export function riyadhDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function riyadhHour(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")?.value || 0);
}

/** Cumulative units expected through today on a paced multi-day task. */
export function cumulativePaceExpected(pace, today = new Date()) {
  if (!pace?.active) return 0;
  const todayKey = isoDayKey(today);
  const start = pace.start;
  if (!start || todayKey < start) return 0;
  if (pace.overdue) return pace.target;
  if (pace.custom && pace.dayPlan && typeof pace.dayPlan === "object") {
    let cum = 0;
    for (const [day, amt] of Object.entries(pace.dayPlan)) {
      if (String(day) <= todayKey) cum += Math.max(0, Number(amt) || 0);
    }
    return Math.min(pace.target, cum);
  }
  const dayIndex = calendarDaysInclusive(start, todayKey) - 1;
  let cum = 0;
  for (let i = 0; i <= dayIndex; i += 1) {
    cum += pace.even + (i < pace.extra ? 1 : 0);
  }
  const base = pace.redistributed ? Math.max(0, Number(pace.baseDone) || 0) : 0;
  return Math.min(pace.target, base + cum);
}

/**
 * Auto-escalate gate — end of Riyadh workday or overdue when pace quota is unmet.
 * Proof Cycle step 4: burn time quota without progress → next handler on branch ladder.
 */
export function checkAutoEscalateGate(task, data, now = new Date(), { force = false } = {}) {
  if (isDone(task)) return { ok: false, error: "DONE" };
  if (isAwaitingApproval(task)) return { ok: false, error: "AWAITING" };

  const done = Number(task.completedCount) || 0;
  const target = Math.max(1, Number(task.targetCount) || 1);
  const pace = deriveDailyTaskPace({
    targetCount: task.targetCount,
    completedCount: done,
    dueAt: task.dueAt,
    startAt: task.startAt || task.createdAt,
    paceStartAt: task.paceStartAt,
    paceSpreadTarget: task.paceSpreadTarget,
    paceDayPlan: task.paceDayPlan,
    today: now,
  });

  let breach = false;
  let breachReason = "";
  let breachReasonEn = "";

  if (pace.active) {
    const expected = cumulativePaceExpected(pace, now);
    if (done < expected) {
      const hour = riyadhHour(now);
      if (pace.overdue || force || hour >= 18) {
        breach = true;
        breachReason = pace.overdue
          ? "تصعيد تلقائي — تجاوز الاستحقاق دون إنجاز المستهدف."
          : "تصعيد تلقائي — لم يُسجَّل إنجاز اليوم المطلوب حتى نهاية الدوام.";
        breachReasonEn = pace.overdue
          ? "Auto-escalated — past due without meeting the target."
          : "Auto-escalated — today's pace quota was not logged by end of shift.";
      }
    }
  } else if (isOverdue(task, now) && done < target) {
    breach = true;
    breachReason = "تصعيد تلقائي — مهمة متأخرة دون إغلاق.";
    breachReasonEn = "Auto-escalated — overdue task still open.";
  }

  if (!breach) return { ok: false, error: "NO_BREACH" };

  const dayKey = riyadhDayKey(now);
  if (task.lastAutoEscalationDay === dayKey && !pace.overdue && !force) {
    return { ok: false, error: "ALREADY_TODAY" };
  }

  const next = nextOpsEscalation(task, data, null);
  if (!next.escalate) {
    return { ok: false, error: "AT_TOP", atTop: true, breachReason, breachReasonEn };
  }

  return {
    ok: true,
    nextLevel: next.nextLevel,
    handlers: next.handlers,
    breachReason,
    breachReasonEn,
    pace,
    expected: cumulativePaceExpected(pace, now),
    done,
  };
}

export function applyOpsAutoEscalate(task, { nextLevel, breachReason, breachReasonEn, now } = {}) {
  const when = now instanceof Date ? now : new Date(now || Date.now());
  const at = when.toISOString();
  const dayKey = riyadhDayKey(when);
  const comments = Array.isArray(task.comments) ? task.comments : [];
  return {
    ...task,
    escalationLevel: nextLevel,
    escalatedAt: at,
    autoEscalated: true,
    lastAutoEscalationDay: dayKey,
    comments: [
      ...comments,
      {
        id: `auto_${at}`,
        authorId: null,
        authorName: "النظام",
        text: breachReason || "تصعيد تلقائي — إيقاع الإنجاز لم يُستوفَ.",
        textEn: breachReasonEn || "Auto-escalated — pace quota not met.",
        isIssue: true,
        is_escalation: true,
        is_auto: true,
        at,
      },
    ],
  };
}

/** Hourly / end-of-day sweep — returns updated task list + count escalated. */
export function runOpsEscalationSweep(tasks, data, now = new Date(), opts = {}) {
  let escalated = 0;
  const details = [];
  const nextTasks = (Array.isArray(tasks) ? tasks : []).map((task) => {
    const gate = checkAutoEscalateGate(task, data, now, opts);
    if (!gate.ok) return task;
    const updated = applyOpsAutoEscalate(task, {
      nextLevel: gate.nextLevel,
      breachReason: gate.breachReason,
      breachReasonEn: gate.breachReasonEn,
      now,
    });
    escalated += 1;
    details.push({ taskId: task.id, ref: task.ref, level: gate.nextLevel });
    return updated;
  });
  return { tasks: nextTasks, escalated, details };
}
