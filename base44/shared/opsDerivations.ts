/** Operations derivation rules — single source for server (and mirrored tests).
 *  Design ref: NiroVera Platform.dc.html class Component (ops / task points / cert gate).
 */
import { deriveBranchEscalationChain } from "./orgDerivations.ts";

export const PRIORITY_VALUE: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Flexible work kinds — office and field companies alike. Default is general. */
export const WORK_KINDS = ["gn", "ad", "of", "tr", "pm", "cm", "em", "pr", "cp"] as const;

export type WorkKind = (typeof WORK_KINDS)[number];

export const WORK_KIND_LABELS: Record<WorkKind, { ar: string; en: string }> = {
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
export const CERT_FOR: Record<string, string | null> = {
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

export const CERT_LABELS: Record<string, { ar: string; en: string }> = {
  fa: { ar: "الإسعافات الأولية", en: "First aid" },
  loto: { ar: "العزل والوسم LOTO", en: "Lock-out / tag-out" },
  wah: { ar: "العمل على ارتفاع", en: "Work at height" },
  cs: { ar: "الأماكن المحصورة", en: "Confined space" },
};

export function normalizeWorkKind(raw: unknown, fallback: WorkKind | string = "gn"): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return fallback;
  const id = trimmed.toLowerCase();
  if ((WORK_KINDS as readonly string[]).includes(id)) return id;
  // Free-text custom work type for companies outside the preset list.
  return trimmed.slice(0, 80);
}

export function workKindLabel(kind: unknown, lang: "ar" | "en" = "ar"): string {
  const id = String(kind || "").trim();
  if (!id) return lang === "en" ? "General" : "عام";
  if (WORK_KIND_LABELS[id as WorkKind]) {
    return WORK_KIND_LABELS[id as WorkKind][lang === "en" ? "en" : "ar"];
  }
  return id;
}

export type AssignMode = "one" | "some" | "all";

export type OpsTaskLike = {
  dueAt?: string | null;
  createdAt?: string | null;
  startAt?: string | null;
  status?: string;
  completedCount?: number;
  targetCount?: number;
  stationId?: string | null;
  pointsAwarded?: number | null;
  approvedAt?: string | null;
  escalationLevel?: number | null;
  comments?: unknown[];
  rejectReason?: string | null;
  planHorizon?: string | null;
  planPinned?: boolean;
};

function localDayStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Local calendar days from today to due (not UTC ISO shift). */
export function dayDiffFromToday(iso: string, today = new Date()) {
  if (!iso) return NaN;
  const due = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(due.getTime())) return NaN;
  return Math.round((due.getTime() - localDayStart(today).getTime()) / 86400000);
}

export function isoDayKey(value?: string | Date | null, today = new Date()) {
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

export function calendarDaysInclusive(fromIso: string, toIso: string) {
  const from = isoDayKey(fromIso);
  const to = isoDayKey(toIso);
  if (!from || !to) return 0;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

export type DailyTaskPace = {
  active: boolean;
  target: number;
  done: number;
  remaining: number;
  days: number;
  daysLeft: number;
  even: number;
  extra: number;
  todayExpected: number;
  overdue: boolean;
  due: string;
  start: string;
};

/** Spread targetCount evenly across calendar days from start to due. Derived — never stored. */
export function deriveDailyTaskPace({
  targetCount,
  completedCount = 0,
  dueAt,
  startAt,
  today = new Date(),
}: {
  targetCount?: number | null;
  completedCount?: number | null;
  dueAt?: string | null;
  startAt?: string | null;
  today?: Date;
} = {}): DailyTaskPace {
  const target = Math.max(0, Math.round(Number(targetCount) || 0));
  const done = Math.max(0, Number(completedCount) || 0);
  const remaining = Math.max(0, target - done);
  const todayKey = isoDayKey(today);
  const due = isoDayKey(dueAt);
  const start = isoDayKey(startAt) || todayKey;
  const empty: DailyTaskPace = {
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
    due: due || "",
    start: start || "",
  };
  if (target <= 1 || !due) return empty;
  const windowStart = start <= due ? start : due;
  const days = Math.max(1, calendarDaysInclusive(windowStart, due));
  const even = Math.floor(target / days);
  const extra = target % days;
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
    due,
    start: windowStart,
  };
}

export function dailyPaceCopy(pace: DailyTaskPace | null | undefined, ar = true) {
  if (!pace?.active) return null;
  if (pace.remaining <= 0) {
    return {
      tone: "done" as const,
      kicker: ar ? "التوزيع على الأيام" : "Spread across days",
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
      tone: "warn" as const,
      kicker: ar ? "متأخر عن التوزيع" : "Behind the spread",
      metrics: [
        { label: ar ? "اليوم" : "Today", value: String(pace.remaining) },
        { label: ar ? "المتبقي" : "Left", value: String(pace.remaining) },
        { label: ar ? "الأيام" : "Days", value: "0" },
      ],
      hint: ar ? "المتبقي يُنجز اليوم" : "Remaining is due today",
    };
  }
  return {
    tone: "ok" as const,
    kicker: ar ? "التوزيع على الأيام" : "Spread across days",
    metrics: [
      { label: ar ? "اليوم" : "Today", value: String(pace.todayExpected) },
      { label: ar ? "المستهدف" : "Target", value: String(pace.target) },
      { label: ar ? "الأيام" : "Days", value: String(pace.days) },
    ],
    hint: ar ? "يُقسَّم العدد بالتساوي حتى تاريخ الاستحقاق" : "The count is split evenly until the due date",
  };
}

export function boardPaceCopy(
  board: { active?: number; todayExpected?: number } | null | undefined,
  ar = true,
) {
  if (!board?.active) return null;
  return {
    tone: "ok" as const,
    kicker: ar ? "التوزيع على الأيام" : "Spread across days",
    metrics: [
      { label: ar ? "اليوم" : "Today", value: String(board.todayExpected || 0) },
      { label: ar ? "الأوامر" : "Orders", value: String(board.active) },
    ],
    hint: ar ? "مجموع إيقاع اليوم للأوامر المؤرخة" : "Sum of today's pace on dated orders",
  };
}

export function dailyPaceLabel(pace: DailyTaskPace | null | undefined, ar = true) {
  const copy = dailyPaceCopy(pace, ar);
  if (!copy) return "";
  const today = copy.metrics[0]?.value || "0";
  return `${copy.kicker} · ${today} · ${copy.hint}`;
}

export function deriveBoardDailyPace(tasks: OpsTaskLike[], today = new Date()) {
  let todayExpected = 0;
  let active = 0;
  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    if (isDone(task) || isAwaitingApproval(task)) return;
    const pace = deriveDailyTaskPace({
      targetCount: task.targetCount,
      completedCount: task.completedCount,
      dueAt: task.dueAt,
      startAt: task.createdAt || task.startAt,
      today,
    });
    if (!pace.active) return;
    active += 1;
    todayExpected += pace.todayExpected;
  });
  return { active, todayExpected };
}

/** Remaining days to due date: ≤7 weekly, ≤31 monthly, ≤92 quarterly, ≤183 half-year, else annual. */
export function planHorizonFromDue(iso: string | null | undefined, today = new Date()) {
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
export function taskPlanHorizon(task: OpsTaskLike | null | undefined, today = new Date()) {
  if (task?.planPinned && task?.planHorizon) return String(task.planHorizon);
  return planHorizonFromDue(task?.dueAt, today);
}

export function clampEffortWeight(raw: unknown) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** Points = priority value (3/2/1) × effort weight (1–5). Granted only after approval. */
export function taskPoints(priority: string | null | undefined, effortWeight: unknown) {
  const pv = PRIORITY_VALUE[String(priority || "medium")] ?? 1;
  return pv * clampEffortWeight(effortWeight);
}

export function isOverdue(task: OpsTaskLike, today = new Date()) {
  if (!task.dueAt) return false;
  if (task.status === "completed" || task.approvedAt) return false;
  return dayDiffFromToday(task.dueAt, today) < 0;
}

export function isDueToday(task: OpsTaskLike, today = new Date()) {
  if (!task.dueAt) return false;
  return dayDiffFromToday(task.dueAt, today) === 0;
}

export function isAwaitingApproval(task: OpsTaskLike) {
  if (task.status === "awaiting_approval" || task.status === "pending_review") return true;
  const done = Number(task.completedCount) || 0;
  const target = Math.max(1, Number(task.targetCount) || 1);
  return done >= target && !task.approvedAt && task.status !== "completed";
}

export function isDone(task: OpsTaskLike) {
  return task.status === "completed" || !!task.approvedAt;
}

export function isEscalated(task: OpsTaskLike) {
  return (Number(task?.escalationLevel) || 0) > 0 && !isDone(task);
}

/** Fallback ladder when the company has no custom HR tiers. */
export const OPS_ROLE_LADDER = ["station_manager", "pgm", "ops_manager", "director", "owner"] as const;

type EscalationPerson = {
  id?: string;
  employeeId?: string;
  role?: string;
  stationId?: string | null;
  managedStations?: string[];
  hrLevelId?: string | null;
  hrStationId?: string | null;
  hrClusterId?: string | null;
  isOwner?: boolean;
  name?: string;
};

type EscalationData = {
  employees?: EscalationPerson[];
  hrLevels?: Array<{ id?: string; order?: number; role?: string; scope?: string; active?: boolean; stationIds?: string[] }>;
  hrClusters?: Array<{ id?: string; stationIds?: string[] }>;
  orgTree?: Array<{ id: string; parentId?: string | null; type?: string; refId?: string; title?: string }>;
  stations?: Array<{ id?: string; stationId?: string; managerId?: string | null; parentStationId?: string | null; parentBranchId?: string | null }>;
  ownerId?: string;
  directorId?: string;
};

function personId(p: EscalationPerson | null | undefined) {
  return p?.id || p?.employeeId || null;
}

export function expandStationIds(
  stations: EscalationData["stations"],
  ids: Array<string | null | undefined>,
) {
  const kids = new Map<string, string[]>();
  (stations || []).forEach((station) => {
    const parent = String(station.parentStationId || station.parentBranchId || "").trim();
    const id = String(station.id || station.stationId || "").trim();
    if (!parent || !id) return;
    const bucket = kids.get(parent) || [];
    bucket.push(id);
    kids.set(parent, bucket);
  });
  const out = new Set<string>();
  (ids || []).forEach((raw) => {
    const seed = String(raw || "").trim();
    if (!seed || seed === "all") return;
    const stack = [seed];
    while (stack.length) {
      const current = stack.pop();
      if (!current || out.has(current)) continue;
      out.add(current);
      (kids.get(current) || []).forEach((child) => stack.push(child));
    }
  });
  return out;
}

function userCoversStation(
  user: { stationId?: string | null; managedStations?: string[] } | null | undefined,
  data: EscalationData | null | undefined,
  stationId?: string | null,
) {
  if (!stationId) return true;
  const home = String(user?.stationId || "").trim();
  const extras = (user?.managedStations || []).map((id) => String(id || "").trim()).filter(Boolean);
  return expandStationIds(data?.stations, [home, ...extras]).has(String(stationId));
}

function opsHrGroups(data?: EscalationData | null) {
  const levels = Array.isArray(data?.hrLevels) ? data.hrLevels : [];
  const orders = [...new Set(levels.map((l) => l.order))].sort((a, b) => Number(a) - Number(b));
  return orders
    .map((order) => ({
      order,
      scope: levels.find((l) => l.order === order)?.scope || "company",
      manager: levels.find((l) => l.order === order && l.role === "manager") || null,
    }))
    .filter((g) => g.manager && g.manager.active !== false);
}

export function opsStageCount(data?: EscalationData | null, stationId?: string | null) {
  const branch = deriveBranchEscalationChain(stationId || null, data);
  if (branch.length) return branch.length;
  const hr = opsHrGroups(data).length;
  return hr > 0 ? hr + 1 : OPS_ROLE_LADDER.length;
}

export function opsHandlersAt(levelIdx: number, task: OpsTaskLike, data?: EscalationData | null) {
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
      if (e.hrLevelId !== group.manager?.id) return false;
      if (group.manager.stationIds?.length && stationId && !group.manager.stationIds.includes(stationId)) return false;
      if (group.scope === "station") return e.hrStationId === stationId;
      if (group.scope === "cluster") {
        const cluster = (data?.hrClusters || []).find((c) => (c.stationIds || []).includes(stationId || ""));
        return cluster ? e.hrClusterId === cluster.id : false;
      }
      return true;
    });
  }
  const role = OPS_ROLE_LADDER[levelIdx];
  if (!role) return [];
  return employees.filter((e) => {
    const isOwner = e.role === "owner" || e.isOwner;
    if (role === "owner") return !!isOwner;
    if (e.role !== role) return false;
    if (role === "station_manager") {
      return !stationId || userCoversStation(e, data, stationId);
    }
    return true;
  });
}

export function nextOpsEscalation(task: OpsTaskLike, data?: EscalationData | null, rejecterId?: string | null) {
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
  return { escalate: false, nextLevel: current, handlers: [] as EscalationPerson[], atTop: true };
}

export function checkRejectReasonGate(reason: unknown, lang = "ar") {
  if (!String(reason || "").trim()) {
    return {
      ok: false as const,
      error: "REASON_REQUIRED",
      reason: lang === "ar" ? "اكتب سبب الرفض — لا رفض بلا سبب مكتوب." : "Write a rejection reason — no silent reject.",
    };
  }
  return { ok: true as const };
}

export function applyOpsReject(task: OpsTaskLike & Record<string, unknown>, input: {
  reason?: string;
  escalate?: boolean;
  nextLevel?: number;
  reviewerId?: string | null;
  reviewerName?: string;
  now?: string;
} = {}) {
  const at = input.now || new Date().toISOString();
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const entry = {
    id: `rej_${at}`,
    authorId: input.reviewerId || null,
    authorName: input.reviewerName || "",
    text: String(input.reason || "").trim(),
    isIssue: false,
    is_rejection: true,
    is_escalation: !!input.escalate,
    at,
  };
  if (input.escalate) {
    return {
      ...task,
      status: "awaiting_approval",
      escalationLevel: input.nextLevel,
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

export function canReviewOpsTask(
  task: OpsTaskLike,
  user: { id?: string; employeeId?: string; role?: string; stationId?: string | null; managedStations?: string[]; isOwner?: boolean; admin?: boolean } | null,
  data?: EscalationData | null,
) {
  if (!user || !task || isDone(task)) return false;
  if (user.isOwner || user.admin || user.role === "owner" || user.role === "admin") return true;
  const uidEarly = String(user.id || user.employeeId || "");
  const branch = deriveBranchEscalationChain(task.stationId, data);
  if (branch.length && uidEarly) {
    const at = Math.max(0, Number(task.escalationLevel) || 0);
    return branch.slice(at).some((s) => String(s.employeeId) === uidEarly);
  }
  const level = Math.max(0, Number(task.escalationLevel) || 0);
  const handlers = opsHandlersAt(level, task, data);
  const uid = String(user.id || user.employeeId || "");
  if (uid && handlers.some((h) => String(personId(h)) === uid)) return true;
  const role = user.role;
  if (level === 0 && ["director", "ops_manager", "station_manager", "pgm"].includes(String(role))) {
    if (role === "station_manager") {
      return !task.stationId || userCoversStation(user, data, task.stationId);
    }
    return true;
  }
  if (level > 0 && ["director", "ops_manager", "pgm"].includes(String(role))) return true;
  return false;
}

/** Every ops counter is derived from the scoped rows — never stored literals. */
export function deriveHorizonGroups(tasks: OpsTaskLike[], today = new Date()) {
  const order = ["y", "h", "q", "m", "w"] as const;
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

export function deriveOpsCounts(tasks: OpsTaskLike[], today = new Date()) {
  const list = Array.isArray(tasks) ? tasks : [];
  const done = list.filter((t) => isDone(t)).length;
  const overdue = list.filter((t) => isOverdue(t, today)).length;
  const dueToday = list.filter((t) => isDueToday(t, today)).length;
  const awaiting = list.filter((t) => isAwaitingApproval(t)).length;
  const escalated = list.filter((t) => isEscalated(t)).length;
  const active = Math.max(0, list.length - done);
  return {
    total: list.length,
    done,
    overdue,
    today: dueToday,
    awaiting,
    escalated,
    active,
    badge: overdue + awaiting,
    pointsAwarded: list.reduce((n, t) => n + (Number(t.pointsAwarded) || 0), 0),
  };
}

export function certCodeOf(cert: Record<string, unknown> | null | undefined) {
  if (!cert) return "";
  const raw = String(cert.code || cert.kind || cert.certCode || cert.category || cert.name || "").toLowerCase();
  if (["fa", "first_aid", "first-aid", "إسعاف"].some((k) => raw.includes(k.replace("_", "")))) return "fa";
  if (raw.includes("loto") || raw.includes("عزل")) return "loto";
  if (raw.includes("wah") || raw.includes("ارتفاع") || raw.includes("height")) return "wah";
  if (raw.includes("cs") || raw.includes("محصور") || raw.includes("confined")) return "cs";
  if (CERT_FOR[raw] !== undefined || CERT_LABELS[raw]) return raw;
  return raw;
}

export function certIsCurrent(cert: Record<string, unknown> | null | undefined, today = new Date()) {
  if (!cert) return false;
  const status = String(cert.status || "approved").toLowerCase();
  if (status === "rejected" || status === "pending" || status === "expired") return false;
  const exp = cert.expiryDate || cert.expiresAt || cert.exp || cert.validUntil;
  if (!exp) return status === "approved" || status === "valid" || status === "active" || !cert.status;
  const end = new Date(`${String(exp).slice(0, 10)}T23:59:59`);
  return !Number.isNaN(end.getTime()) && end.getTime() >= localDayStart(today).getTime();
}

export function employeeLacksCert(
  employee: { employeeId?: string; id?: string; name?: string; certificates?: unknown[] } | null,
  required: string | null,
  today = new Date(),
) {
  if (!required) return false;
  const certs = Array.isArray(employee?.certificates) ? employee.certificates : [];
  return !certs.some((c) => certCodeOf(c as Record<string, unknown>) === required && certIsCurrent(c as Record<string, unknown>, today));
}

export type AssignGatePerson = {
  employeeId: string;
  id?: string;
  name?: string;
  certificates?: unknown[];
};

/**
 * Server-side assignment gate. Validates that an owner/team exists in the
 * company. Expired competency certificates are informational only.
 */
export function checkAssignGate(input: {
  workKind: string;
  assignMode: AssignMode;
  ownerId?: string | null;
  memberIds?: string[];
  stationId?: string | null;
  people: AssignGatePerson[];
  lang?: "ar" | "en";
  today?: Date;
}) {
  const required = CERT_FOR[input.workKind] ?? null;
  const lang = input.lang === "en" ? "en" : "ar";
  if (!required) return { ok: true as const, required: null, blocked: [] as AssignGatePerson[] };

  const label = CERT_LABELS[required]?.[lang] || required;
  const byId = new Map<string, AssignGatePerson>();
  for (const p of input.people || []) {
    if (p.employeeId) byId.set(String(p.employeeId), p);
    if (p.id) byId.set(String(p.id), p);
  }

  if (input.assignMode === "one") {
    if (!input.ownerId) {
      return {
        ok: false as const,
        required,
        blocked: [],
        reason: lang === "ar" ? "لا يمكن الإسناد: لم يُحدَّد مسؤول." : "Cannot assign: no owner selected.",
        certLabel: label,
      };
    }
    if (!byId.get(input.ownerId)) {
      return {
        ok: false as const,
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
        ok: false as const,
        required,
        blocked: [],
        reason: lang === "ar" ? "لا يمكن الإسناد: لم يُختَر أحد من الفريق." : "Cannot assign: no team members selected.",
        certLabel: label,
      };
    }
    if (ids.some((id) => !byId.has(id))) {
      return {
        ok: false as const,
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
      ok: false as const,
      required,
      blocked: [],
      reason: lang === "ar" ? "لا يمكن الإسناد: لا طاقم في هذا الفرع." : "Cannot assign: no crew at this station.",
      certLabel: label,
    };
  }

  return { ok: true as const, required, blocked: [], certLabel: label };
}

export type AssignmentHistoryEntry = {
  fromId?: string | null;
  toId: string;
  byId?: string | null;
  reason?: string;
  at: string;
  fromName?: string;
  toName?: string;
  byName?: string;
};

export function taskAssigneeId(task: { ownerId?: string | null; employee_id?: string | null; assignedTo?: string | null } | null | undefined) {
  return task?.ownerId || task?.employee_id || task?.assignedTo || null;
}

export function latestAssignment(task: { assignmentHistory?: AssignmentHistoryEntry[] } | null | undefined) {
  const hist = Array.isArray(task?.assignmentHistory) ? task.assignmentHistory : [];
  return hist.length ? hist[hist.length - 1] : null;
}

export function assignmentHistoryNote(entry: AssignmentHistoryEntry | null | undefined, lang = "ar") {
  if (!entry) return "";
  const from = entry.fromName || "—";
  const to = entry.toName || "—";
  const reason = String(entry.reason || "").trim();
  if (lang === "en") {
    return reason ? `Delegated from ${from} to ${to} — ${reason}` : `Delegated from ${from} to ${to}`;
  }
  return reason ? `وُكِّل من ${from} إلى ${to} — ${reason}` : `وُكِّل من ${from} إلى ${to}`;
}

/** Manager-only توكيل. Closed / approved / awaiting-review tasks stay on the proof chain. */
export function canReassignOpsTask(
  task: OpsTaskLike & { assignMode?: string; ownerId?: string | null; employee_id?: string | null; assignedTo?: string | null },
  user: EscalationPerson & { admin?: boolean } | null | undefined,
  data?: EscalationData | null,
) {
  if (!user || !task) return false;
  if (isDone(task) || isAwaitingApproval(task)) return false;
  const mode = task.assignMode || "one";
  if (mode !== "one" && !taskAssigneeId(task)) return false;
  const uid = user.id || user.employeeId;
  const isOwner = user.role === "owner" || user.isOwner || user.admin
    || (data?.ownerId && uid && String(uid) === String(data.ownerId));
  if (isOwner) return true;
  if (!["director", "ops_manager", "pgm", "station_manager"].includes(String(user.role || ""))) return false;
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

export function checkReassignGate(input: {
  task: OpsTaskLike & { assignMode?: string; ownerId?: string | null; employee_id?: string | null; assignedTo?: string | null };
  user: EscalationPerson & { admin?: boolean };
  data?: EscalationData | null;
  toId?: string | null;
  reason?: string;
  people?: Array<{ employeeId?: string; id?: string }>;
  lang?: "ar" | "en";
}) {
  const lang = input.lang === "en" ? "en" : "ar";
  const toId = String(input.toId || "").trim();
  const reason = String(input.reason || "").trim();

  if (!canReassignOpsTask(input.task, input.user, input.data)) {
    return {
      ok: false as const,
      error: "REASSIGN_FORBIDDEN",
      reason: lang === "ar"
        ? "التوكيل للمدير فقط — وبعد الإنجاز أو الاعتماد لا يُعاد إسناد المهمة."
        : "Only a manager can delegate, and a completed or approved task cannot be reassigned.",
    };
  }
  if (!reason) {
    return {
      ok: false as const,
      error: "REASON_REQUIRED",
      reason: lang === "ar"
        ? "اكتب سبب التوكيل — لماذا لم تُنجز المهمة."
        : "Write why the task is being delegated.",
    };
  }
  if (!toId) {
    return {
      ok: false as const,
      error: "ASSIGNEE_REQUIRED",
      reason: lang === "ar" ? "اختر الموظف الموكَّل إليه." : "Pick the employee to delegate to.",
    };
  }
  const fromId = String(taskAssigneeId(input.task) || "");
  if (fromId && fromId === toId) {
    return {
      ok: false as const,
      error: "SELF_REASSIGN_FORBIDDEN",
      reason: lang === "ar" ? "لا توكيل إلى نفس المسؤول الحالي." : "Cannot delegate to the current assignee.",
    };
  }
  const people = Array.isArray(input.people) ? input.people : [];
  const byId = new Map(people.map((p) => [String(p.employeeId || p.id), p]));
  if (!byId.has(toId)) {
    return {
      ok: false as const,
      error: "ASSIGNEE_OUT_OF_SCOPE",
      reason: lang === "ar"
        ? "الموظف المختار خارج نطاق الفرع الظاهر."
        : "The selected employee is outside the visible station scope.",
    };
  }
  return { ok: true as const, fromId: fromId || null, toId };
}

export function applyOpsReassign(task: OpsTaskLike & Record<string, unknown>, input: {
  fromId?: string | null;
  toId: string;
  byId?: string | null;
  reason?: string;
  at?: string;
  fromName?: string;
  toName?: string;
  byName?: string;
  lang?: "ar" | "en";
} = { toId: "" }) {
  const at = input.at || new Date().toISOString();
  const fromId = input.fromId || taskAssigneeId(task) || null;
  const toId = input.toId;
  const reason = String(input.reason || "").trim();
  const entry: AssignmentHistoryEntry = {
    fromId,
    toId,
    byId: input.byId || null,
    reason,
    at,
    fromName: input.fromName || "",
    toName: input.toName || "",
    byName: input.byName || "",
  };
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const note = assignmentHistoryNote(entry, input.lang === "en" ? "en" : "ar");
  return {
    ...task,
    ownerId: toId,
    assignedTo: toId,
    employee_id: toId,
    ownerName: entry.toName || task.ownerName,
    originalOwnerId: task.originalOwnerId || fromId,
    assignmentHistory: [...(Array.isArray(task.assignmentHistory) ? task.assignmentHistory as AssignmentHistoryEntry[] : []), entry],
    comments: [...comments, {
      id: `reassign_${at}`,
      authorId: entry.byId,
      authorName: entry.byName,
      text: note,
      isIssue: false,
      is_reassignment: true,
      at,
    }],
  };
}

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

export function cumulativePaceExpected(pace: DailyTaskPace | null | undefined, today = new Date()) {
  if (!pace?.active) return 0;
  const todayKey = isoDayKey(today);
  const start = pace.start;
  if (!start || todayKey < start) return 0;
  if (pace.overdue) return pace.target;
  const dayIndex = calendarDaysInclusive(start, todayKey) - 1;
  let cum = 0;
  for (let i = 0; i <= dayIndex; i += 1) {
    cum += pace.even + (i < pace.extra ? 1 : 0);
  }
  return Math.min(pace.target, cum);
}

export function checkAutoEscalateGate(
  task: OpsTaskLike,
  data?: EscalationData | null,
  now = new Date(),
  opts: { force?: boolean } = {},
) {
  if (isDone(task)) return { ok: false as const, error: "DONE" };
  if (isAwaitingApproval(task)) return { ok: false as const, error: "AWAITING" };

  const done = Number(task.completedCount) || 0;
  const target = Math.max(1, Number(task.targetCount) || 1);
  const pace = deriveDailyTaskPace({
    targetCount: task.targetCount,
    completedCount: done,
    dueAt: task.dueAt,
    startAt: task.createdAt || task.startAt,
    today: now,
  });

  let breach = false;
  let breachReason = "";
  let breachReasonEn = "";

  if (pace.active) {
    const expected = cumulativePaceExpected(pace, now);
    if (done < expected) {
      const hour = riyadhHour(now);
      if (pace.overdue || opts.force || hour >= 18) {
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

  if (!breach) return { ok: false as const, error: "NO_BREACH" };

  const dayKey = riyadhDayKey(now);
  if (task.lastAutoEscalationDay === dayKey && !pace.overdue && !opts.force) {
    return { ok: false as const, error: "ALREADY_TODAY" };
  }

  const next = nextOpsEscalation(task, data, null);
  if (!next.escalate) {
    return { ok: false as const, error: "AT_TOP", atTop: true, breachReason, breachReasonEn };
  }

  return {
    ok: true as const,
    nextLevel: next.nextLevel,
    handlers: next.handlers,
    breachReason,
    breachReasonEn,
    pace,
    expected: cumulativePaceExpected(pace, now),
    done,
  };
}

export function applyOpsAutoEscalate(
  task: OpsTaskLike,
  { nextLevel, breachReason, breachReasonEn, now }: {
    nextLevel: number;
    breachReason?: string;
    breachReasonEn?: string;
    now?: Date | string;
  },
) {
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

export function runOpsEscalationSweep(
  tasks: OpsTaskLike[],
  data?: EscalationData | null,
  now = new Date(),
  opts: { force?: boolean } = {},
) {
  let escalated = 0;
  const details: Array<{ taskId?: string; ref?: string; level: number }> = [];
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
