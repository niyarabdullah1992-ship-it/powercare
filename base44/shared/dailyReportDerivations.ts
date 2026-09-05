/** Daily report — per-station derived facts; lateness ≠ approval.
 *  Design: NiroVera Platform.dc.html (dailyRows / isLate / lateChip / facts).
 */

export const DEFAULT_SHIFT_END = "14:00";

export type DailyFact = {
  id: "tasks" | "hazards" | "absence" | "proofs";
  value: number;
  link: "ops" | "hse" | "attendance" | "workproof";
  bad: boolean;
};

export type DailyReportLike = {
  stationId: string;
  filedAt?: string | null; // HH:mm
  filedBy?: string | null;
  note?: string | null;
  approved?: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  returnedAt?: string | null;
  returnReason?: string | null;
  dateKey?: string;
};

export function parseHm(hm: string | null | undefined) {
  const m = String(hm || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Late if filed after shift end. Missing (no file) is not "late" unless marked overdue. */
export function isLateSubmit(filedAt: string | null | undefined, shiftEnd = DEFAULT_SHIFT_END) {
  const t = parseHm(filedAt);
  const end = parseHm(shiftEnd);
  if (t == null || end == null) return false;
  return t > end;
}

export function deriveStationFacts(input: {
  tasksClosed?: number;
  openHazards?: number;
  unexcusedAbsences?: number;
  proofsApproved?: number;
}): DailyFact[] {
  return [
    { id: "tasks", value: Math.max(0, Number(input.tasksClosed) || 0), link: "ops", bad: false },
    { id: "hazards", value: Math.max(0, Number(input.openHazards) || 0), link: "hse", bad: true },
    { id: "absence", value: Math.max(0, Number(input.unexcusedAbsences) || 0), link: "attendance", bad: true },
    { id: "proofs", value: Math.max(0, Number(input.proofsApproved) || 0), link: "workproof", bad: false },
  ];
}

export function deriveDailyRowStatus(
  report: DailyReportLike,
  opts: { shiftEnd?: string; shiftEnded?: boolean } = {},
) {
  const shiftEnd = opts.shiftEnd || DEFAULT_SHIFT_END;
  const filedAt = report.filedAt || null;
  const isLate = isLateSubmit(filedAt, shiftEnd);
  const approved = !!report.approved;
  const missing = !approved && !filedAt;
  const overdueMissing = missing && !!opts.shiftEnded;

  let status: "approved" | "ok" | "late" | "review" | "missing" = "missing";
  if (approved) status = "approved";
  else if (filedAt && isLate) status = "late";
  else if (filedAt && report.returnedAt) status = "review";
  else if (filedAt) status = "ok";
  else if (overdueMissing) status = "late";
  else status = "missing";

  return {
    stationId: report.stationId,
    filedAt: filedAt || "—",
    isLate: approved ? isLate : isLate || overdueMissing, // approval never clears lateness
    approved,
    missing,
    canApprove: !approved && !!filedAt,
    canCloseShift: approved && !!filedAt,
    status,
    lateChip: approved && isLate,
  };
}

/** Station manager files; ops / director / owner approve. Higher roles may file on behalf. */
export const DAILY_FILE_ROLES = [
  "station_manager",
  "ops_manager",
  "director",
  "owner",
  "pgm",
  "admin",
] as const;

export const DAILY_APPROVE_ROLES = [
  "ops_manager",
  "director",
  "owner",
  "pgm",
  "admin",
] as const;

export function canFileDailyRole(role: string | null | undefined, owner = false) {
  if (owner) return true;
  return DAILY_FILE_ROLES.includes(String(role || "") as (typeof DAILY_FILE_ROLES)[number]);
}

export function canApproveDailyRole(role: string | null | undefined, owner = false) {
  if (owner) return true;
  return DAILY_APPROVE_ROLES.includes(String(role || "") as (typeof DAILY_APPROVE_ROLES)[number]);
}

export function checkFileDailyGate(opts: {
  role?: string | null;
  owner?: boolean;
  stationId?: string | null;
  userStationId?: string | null;
  managedStations?: string[] | null;
  report?: DailyReportLike | null;
}) {
  if (!canFileDailyRole(opts.role, !!opts.owner)) {
    return {
      ok: false as const,
      error: "FORBIDDEN_FILE",
      reason: "رفع التقرير من صلاحية مدير الفرع (أو من ينوب عنه).",
      reasonEn: "Filing is for the station manager (or a higher ops role on their behalf).",
    };
  }
  const stationId = String(opts.stationId || "").trim();
  if (!stationId) {
    return { ok: false as const, error: "MISSING_STATION", reason: "الفرع مطلوبة.", reasonEn: "Station is required." };
  }
  const role = String(opts.role || "");
  if (role === "station_manager" && !opts.owner) {
    const managed = (opts.managedStations || []).map(String);
    const home = opts.userStationId != null ? String(opts.userStationId) : "";
    const allowed = managed.includes(stationId) || (home && home === stationId);
    if (!allowed) {
      return {
        ok: false as const,
        error: "STATION_SCOPE",
        reason: "لا ترفع تقرير فرع خارج نطاقك.",
        reasonEn: "You cannot file a report for a station outside your scope.",
      };
    }
  }
  if (opts.report?.approved) {
    return {
      ok: false as const,
      error: "ALREADY_APPROVED",
      reason: "التقرير معتمد — أعده للتصحيح قبل إعادة الرفع.",
      reasonEn: "Report is approved — return it for correction before refiling.",
    };
  }
  return { ok: true as const };
}

export function checkApproveDailyGate(report: DailyReportLike | null | undefined) {
  if (!report) {
    return { ok: false as const, error: "REPORT_NOT_FOUND", reason: "التقرير غير موجود.", reasonEn: "Report not found." };
  }
  if (report.approved) {
    return { ok: false as const, error: "ALREADY_APPROVED", reason: "التقرير معتمد مسبقًا.", reasonEn: "Report already approved." };
  }
  if (!report.filedAt) {
    return {
      ok: false as const,
      error: "NOT_FILED",
      reason: "لا اعتماد قبل رفع التقرير من الفرع.",
      reasonEn: "Cannot approve before the station files the report.",
    };
  }
  return {
    ok: true as const,
    // Caller must persist isLate separately from approved.
    isLate: isLateSubmit(report.filedAt),
  };
}

export function checkApproveDailyRoleGate(role: string | null | undefined, owner = false) {
  if (!canApproveDailyRole(role, owner)) {
    return {
      ok: false as const,
      error: "FORBIDDEN_APPROVE",
      reason: "الاعتماد من صلاحية العمليات أو الإدارة — ليس مدير الفرع وحده.",
      reasonEn: "Approval is for ops / leadership — not the station manager alone.",
    };
  }
  return { ok: true as const };
}

/** Shift cannot close until that station's daily report is filed and approved. */
export function checkCloseShiftDailyGate(report: DailyReportLike | null | undefined) {
  if (!report?.filedAt) {
    return {
      ok: false as const,
      error: "SHIFT_OPEN_NOT_FILED",
      reason: "لا إغلاق للوردية قبل رفع التقرير اليومي.",
      reasonEn: "The shift cannot close before the daily report is filed.",
    };
  }
  if (!report.approved) {
    return {
      ok: false as const,
      error: "SHIFT_OPEN_NOT_APPROVED",
      reason: "لا إغلاق للوردية قبل اعتماد التقرير من المشرف.",
      reasonEn: "The shift cannot close before the supervisor approves the report.",
    };
  }
  return { ok: true as const };
}

/** Signed daily record — once per day, only when every row in scope is approved. */
export function checkIssueSignedDailyGate(opts: {
  rows?: Array<{ approved?: boolean; stationName?: string; missing?: boolean }>;
  alreadyIssued?: boolean;
}) {
  if (opts.alreadyIssued) {
    return {
      ok: false as const,
      error: "ALREADY_ISSUED",
      reason: "حُصيلة اليوم الموقّعة صدرت مسبقًا — مرة واحدة في اليوم.",
      reasonEn: "Today's signed daily record was already issued — once per day.",
    };
  }
  const rows = Array.isArray(opts.rows) ? opts.rows : [];
  if (!rows.length) {
    return {
      ok: false as const,
      error: "NO_ROWS",
      reason: "لا فروع لإصدار الحصيلة.",
      reasonEn: "No stations to issue a signed record for.",
    };
  }
  const pending = rows.filter((r) => !r.approved);
  if (pending.length) {
    return {
      ok: false as const,
      error: "NOT_ALL_APPROVED",
      reason: `لا إصدار قبل اعتماد كل التقارير (${pending.length} متبقية).`,
      reasonEn: `Cannot issue until every report is approved (${pending.length} left).`,
    };
  }
  return { ok: true as const };
}

/** Short shift note from derived facts — not a long freeform essay. */
export function buildShortDailyNote(facts: DailyFact[] = [], ar = true) {
  const get = (id: DailyFact["id"]) => facts.find((f) => f.id === id)?.value ?? 0;
  if (ar) {
    return `مهام مغلقة ${get("tasks")} · مخاطر ${get("hazards")} · غياب ${get("absence")} · إثباتات ${get("proofs")}`;
  }
  return `Closed tasks ${get("tasks")} · hazards ${get("hazards")} · absences ${get("absence")} · proofs ${get("proofs")}`;
}

export function deriveDailySummary(
  rows: Array<{ filedAt?: string; isLate?: boolean; approved?: boolean; missing?: boolean; canApprove?: boolean }>,
) {
  const list = Array.isArray(rows) ? rows : [];
  const total = list.length;
  const submitted = list.filter((r) => r.filedAt && r.filedAt !== "—").length;
  const late = list.filter((r) => r.isLate).length;
  const ready = list.filter((r) => r.canApprove).length;
  const missing = list.filter((r) => r.missing).length;
  const closable = list.filter((r) => r.approved).length;
  const mins = list
    .map((r) => parseHm(r.filedAt === "—" ? null : r.filedAt))
    .filter((n): n is number => n != null);
  const avg = mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null;
  const avgHm =
    avg == null
      ? null
      : `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
  return { total, submitted, late, ready, missing, closable, avgSubmitTime: avgHm };
}

export function riyadhDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
