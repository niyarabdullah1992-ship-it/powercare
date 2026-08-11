/** Operations derivation rules — single source for server (and mirrored tests).
 *  Design ref: NiroVera Platform.dc.html class Component (ops / task points / cert gate).
 */

export const PRIORITY_VALUE: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const CERT_FOR: Record<string, string | null> = {
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

export type AssignMode = "one" | "some" | "all";

export type OpsTaskLike = {
  dueAt?: string | null;
  status?: string;
  completedCount?: number;
  targetCount?: number;
  stationId?: string | null;
  pointsAwarded?: number | null;
  approvedAt?: string | null;
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

/** Plan horizon from due date unless pinned. */
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

/** Every ops counter is derived from the scoped rows — never stored literals. */
export function deriveOpsCounts(tasks: OpsTaskLike[], today = new Date()) {
  const list = Array.isArray(tasks) ? tasks : [];
  const done = list.filter((t) => isDone(t)).length;
  const overdue = list.filter((t) => isOverdue(t, today)).length;
  const dueToday = list.filter((t) => isDueToday(t, today)).length;
  const awaiting = list.filter((t) => isAwaitingApproval(t)).length;
  const active = Math.max(0, list.length - done);
  return {
    total: list.length,
    done,
    overdue,
    today: dueToday,
    awaiting,
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
  name?: string;
  certificates?: unknown[];
};

/**
 * Server-side assignment gate. Browser-only checks are not gates.
 * Returns a named Arabic/English reason when blocked.
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
  const today = input.today || new Date();
  if (!required) return { ok: true as const, required: null, blocked: [] as AssignGatePerson[] };

  const label = CERT_LABELS[required]?.[lang] || required;
  const byId = new Map(input.people.map((p) => [p.employeeId, p]));
  let candidates: AssignGatePerson[] = [];

  if (input.assignMode === "one") {
    const p = input.ownerId ? byId.get(input.ownerId) : null;
    if (p) candidates = [p];
  } else if (input.assignMode === "some") {
    candidates = (input.memberIds || []).map((id) => byId.get(id)).filter(Boolean) as AssignGatePerson[];
  } else {
    candidates = input.people.filter((p) => !input.stationId || true);
    // Caller should pass station-filtered people for "all".
    candidates = input.people;
  }

  const blocked = candidates.filter((p) => employeeLacksCert(p, required, today));
  if (!blocked.length) return { ok: true as const, required, blocked: [] };

  const names = blocked.map((p) => p.name || p.employeeId).join(lang === "ar" ? "، " : ", ");
  let reason: string;
  if (input.assignMode === "one") {
    reason = lang === "ar"
      ? `لا يمكن الإسناد: شهادة ${label} منتهية لهذا الموظف. جدّدها في قسم السلامة أو اختر مسؤولًا آخر.`
      : `Cannot assign: this employee's ${label} certification has lapsed. Renew it in Safety or pick another owner.`;
  } else if (input.assignMode === "some") {
    reason = lang === "ar"
      ? `لا يمكن الإسناد: شهادة ${label} منتهية لـ ${names}. أزلهم من التحديد أو جدّد الشهادة في قسم السلامة.`
      : `Cannot assign: ${label} has lapsed for ${names}. Remove them from the selection or renew the certification in Safety.`;
  } else {
    reason = lang === "ar"
      ? `لا يمكن إسنادها لكامل فريق المحطة: شهادة ${label} منتهية لـ ${names}. أسندها لعدد محدد أو جدّد الشهادة.`
      : `Cannot assign to the whole station crew: ${label} has lapsed for ${names}. Assign to specific people or renew the certification.`;
  }
  return { ok: false as const, required, blocked, reason, certLabel: label };
}
