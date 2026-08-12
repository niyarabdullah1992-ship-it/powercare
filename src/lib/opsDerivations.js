/** Client mirror of base44/shared/opsDerivations.ts — keep in sync. */

export const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };

export const CERT_FOR = { pm: "loto", cm: "loto", em: "fa", pr: "wah", cp: null };

export const CERT_LABELS = {
  fa: { ar: "الإسعافات الأولية", en: "First aid" },
  loto: { ar: "العزل والوسم LOTO", en: "Lock-out / tag-out" },
  wah: { ar: "العمل على ارتفاع", en: "Work at height" },
  cs: { ar: "الأماكن المحصورة", en: "Confined space" },
};

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

export function deriveOpsCounts(tasks, today = new Date()) {
  const list = Array.isArray(tasks) ? tasks : [];
  const done = list.filter(isDone).length;
  const overdue = list.filter((t) => isOverdue(t, today)).length;
  const dueToday = list.filter((t) => isDueToday(t, today)).length;
  const awaiting = list.filter(isAwaitingApproval).length;
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
 * Assignment gate (same rules as server). Surfaces missing certificate name.
 * Browser preview is not a substitute for the server gate.
 */
export function checkAssignGate(input) {
  const required = CERT_FOR[input.workKind] ?? null;
  const lang = input.lang === "en" ? "en" : "ar";
  const today = input.today || new Date();
  if (!required) return { ok: true, required: null, blocked: [] };

  const label = CERT_LABELS[required]?.[lang] || required;
  const byId = new Map(input.people.map((p) => [p.employeeId, p]));
  let candidates = [];

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
    const p = byId.get(input.ownerId);
    if (!p) {
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
    candidates = [p];
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
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) {
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
    candidates = ids.map((id) => byId.get(id));
  } else {
    candidates = input.people;
    if (!candidates.length) {
      return {
        ok: false,
        required,
        blocked: [],
        reason: lang === "ar" ? "لا يمكن الإسناد: لا طاقم في هذه المحطة." : "Cannot assign: no crew at this station.",
        certLabel: label,
      };
    }
  }

  const blocked = candidates.filter((p) => employeeLacksCert(p, required, today));
  if (!blocked.length) return { ok: true, required, blocked: [] };

  const names = blocked.map((p) => p.name || p.employeeId).join(lang === "ar" ? "، " : ", ");
  let reason;
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
  return { ok: false, required, blocked, reason, certLabel: label };
}
