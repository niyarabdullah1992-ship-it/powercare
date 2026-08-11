/** Client mirror of base44/shared/dailyReportDerivations.ts */

export const DEFAULT_SHIFT_END = "14:00";

export function parseHm(hm) {
  const m = String(hm || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function isLateSubmit(filedAt, shiftEnd = DEFAULT_SHIFT_END) {
  const t = parseHm(filedAt);
  const end = parseHm(shiftEnd);
  if (t == null || end == null) return false;
  return t > end;
}

export function deriveStationFacts({ tasksClosed = 0, openHazards = 0, unexcusedAbsences = 0, proofsApproved = 0 } = {}) {
  return [
    { id: "tasks", value: Math.max(0, Number(tasksClosed) || 0), link: "ops", bad: false },
    { id: "hazards", value: Math.max(0, Number(openHazards) || 0), link: "hse", bad: true },
    { id: "absence", value: Math.max(0, Number(unexcusedAbsences) || 0), link: "attendance", bad: true },
    { id: "proofs", value: Math.max(0, Number(proofsApproved) || 0), link: "workproof", bad: false },
  ];
}

export function deriveDailyRowStatus(report, { shiftEnd = DEFAULT_SHIFT_END, shiftEnded = false } = {}) {
  const filedAt = report.filedAt || null;
  const isLate = isLateSubmit(filedAt, shiftEnd);
  const approved = !!report.approved;
  const missing = !approved && !filedAt;
  const overdueMissing = missing && shiftEnded;
  let status = "missing";
  if (approved) status = "approved";
  else if (filedAt && isLate) status = "late";
  else if (filedAt && report.returnedAt) status = "review";
  else if (filedAt) status = "ok";
  else if (overdueMissing) status = "late";
  return {
    stationId: report.stationId,
    filedAt: filedAt || "—",
    isLate: approved ? isLate : isLate || overdueMissing,
    approved,
    missing,
    canApprove: !approved && !!filedAt,
    status,
    lateChip: approved && isLate,
  };
}

export function checkApproveDailyGate(report) {
  if (!report) return { ok: false, error: "REPORT_NOT_FOUND", reason: "التقرير غير موجود." };
  if (report.approved) return { ok: false, error: "ALREADY_APPROVED", reason: "التقرير معتمد مسبقًا." };
  if (!report.filedAt) return { ok: false, error: "NOT_FILED", reason: "لا اعتماد قبل رفع التقرير من المحطة." };
  return { ok: true, isLate: isLateSubmit(report.filedAt) };
}

export function deriveDailySummary(rows = []) {
  const total = rows.length;
  const submitted = rows.filter((r) => r.filedAt && r.filedAt !== "—").length;
  const late = rows.filter((r) => r.isLate).length;
  const ready = rows.filter((r) => r.canApprove).length;
  const missing = rows.filter((r) => r.missing).length;
  const mins = rows.map((r) => parseHm(r.filedAt === "—" ? null : r.filedAt)).filter((n) => n != null);
  const avg = mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null;
  const avgHm = avg == null ? null : `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
  return { total, submitted, late, ready, missing, avgSubmitTime: avgHm };
}
