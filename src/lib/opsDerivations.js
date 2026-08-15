/** Client mirror of base44/shared/opsDerivations.ts — keep in sync. */
import { deriveBranchEscalationChain } from "@/lib/orgDerivations";

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

/** YYYY-MM-DD that is `days` local calendar days after today. */
export function addLocalDays(days, today = new Date()) {
  const n = Math.round(Number(days) || 0);
  const d = localDayStart(today);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Daily pace is derived: remaining units ÷ remaining days to due.
 * Example: 30 tasks due in 15 days → 2 per day. Not a separately stored quota.
 */
export function deriveTaskDailyPace(task, today = new Date()) {
  const total = Math.max(1, Number(task?.targetCount) || 1);
  const done = Math.max(0, Number(task?.completedCount) || 0);
  const remaining = Math.max(0, total - done);
  const dueAt = task?.dueAt ? String(task.dueAt).slice(0, 10) : "";
  const met = remaining === 0;
  const horizonSpan = daysForPlanHorizon(task?.planHorizon);
  if (!dueAt) {
    if (horizonSpan) {
      const daily = met ? 0 : Math.ceil(remaining / horizonSpan);
      return {
        total,
        done,
        remaining,
        dueAt: null,
        daysLeft: horizonSpan,
        daily,
        overdue: false,
        met,
      };
    }
    return {
      total,
      done,
      remaining,
      dueAt: null,
      daysLeft: null,
      daily: null,
      overdue: false,
      met,
    };
  }
  const diff = dayDiffFromToday(dueAt, today);
  if (Number.isNaN(diff)) {
    return {
      total,
      done,
      remaining,
      dueAt,
      daysLeft: null,
      daily: null,
      overdue: false,
      met,
    };
  }
  const overdue = diff < 0 && !met;
  const daysLeft = overdue ? 0 : Math.max(1, diff);
  const daily = met ? 0 : (overdue ? remaining : Math.ceil(remaining / daysLeft));
  return { total, done, remaining, dueAt, daysLeft, daily, overdue, met };
}

export function taskDailyPaceLabel(pace, ar = true) {
  if (!pace) return "";
  if (pace.met) return ar ? "أُغلق العدد المستهدف." : "Target count is met.";
  if (pace.daily == null) {
    return ar
      ? "حدد مدة التسليم أو تاريخه ليُحسب العدد اليومي تلقائياً."
      : "Set a duration or due date to derive the daily count.";
  }
  if (pace.overdue) {
    return ar
      ? `انتهى الأجل — المتبقي ${pace.remaining} يُطلب اليوم.`
      : `Past due — ${pace.remaining} remain today.`;
  }
  if (pace.done === 0) {
    return ar
      ? `إجمالي ${pace.total} خلال ${pace.daysLeft} يوماً = ${pace.daily} كل يوم.`
      : `${pace.total} over ${pace.daysLeft} days = ${pace.daily} per day.`;
  }
  return ar
    ? `متبقّي ${pace.remaining} خلال ${pace.daysLeft} يوماً = ${pace.daily} كل يوم.`
    : `${pace.remaining} left over ${pace.daysLeft} days = ${pace.daily} per day.`;
}

/** Calendar days used when a plan horizon is pinned (سنوية / شهرية / …). */
export const HORIZON_DAYS = { w: 7, m: 30, q: 92, h: 183, y: 365 };

export function daysForPlanHorizon(horizon) {
  const n = HORIZON_DAYS[horizon];
  return n || null;
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
        && (e.stationId === stationId || (e.managedStations || []).includes(stationId))
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
      return !stationId || e.stationId === stationId || (e.managedStations || []).includes(stationId);
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
      return !task.stationId
        || user.stationId === task.stationId
        || (user.managedStations || []).includes(task.stationId);
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

export function assignmentHistoryNote(entry, lang = "ar") {
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
    if (user.stationId === sid || (user.managedStations || []).includes(sid)) return true;
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
        ? "اكتب سبب التوكيل — لماذا لم تُنجز المهمة."
        : "Write why the task is being delegated.",
    };
  }
  if (!toId) {
    return {
      ok: false,
      error: "ASSIGNEE_REQUIRED",
      reason: lang === "ar" ? "اختر الموظف الموكَّل إليه." : "Pick the employee to delegate to.",
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
  const byId = new Map(people.map((p) => [String(p.employeeId || p.id), p]));
  if (!byId.has(toId)) {
    return {
      ok: false,
      error: "ASSIGNEE_OUT_OF_SCOPE",
      reason: lang === "ar"
        ? "الموظف المختار خارج نطاق الفرع الظاهر."
        : "The selected employee is outside the visible station scope.",
    };
  }
  return { ok: true, fromId: fromId || null, toId };
}

export function applyOpsReassign(task, input = {}) {
  const at = input.at || new Date().toISOString();
  const fromId = input.fromId || taskAssigneeId(task) || null;
  const toId = input.toId;
  const reason = String(input.reason || "").trim();
  const entry = {
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
    assignmentHistory: [...(Array.isArray(task.assignmentHistory) ? task.assignmentHistory : []), entry],
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
