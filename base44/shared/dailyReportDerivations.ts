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
    status,
    lateChip: approved && isLate,
  };
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
      reason: "لا اعتماد قبل رفع التقرير من المحطة.",
      reasonEn: "Cannot approve before the station files the report.",
    };
  }
  return {
    ok: true as const,
    // Caller must persist isLate separately from approved.
    isLate: isLateSubmit(report.filedAt),
  };
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
  const mins = list
    .map((r) => parseHm(r.filedAt === "—" ? null : r.filedAt))
    .filter((n): n is number => n != null);
  const avg = mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null;
  const avgHm =
    avg == null
      ? null
      : `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
  return { total, submitted, late, ready, missing, avgSubmitTime: avgHm };
}

export function riyadhDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
