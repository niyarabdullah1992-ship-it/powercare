/** Performance score — fixed weights + transitional max(new, old).
 *  Design: task 50% · on-time 25% · safety 15% (70% closure + 30% reporting) · coverage 10%.
 *  Attendance weight is 0 — it is a gate/input, never a score term.
 */

export const PERF_WEIGHTS = {
  pts: 0.5,
  ontime: 0.25,
  hse: 0.15,
  cover: 0.1,
  att: 0,
} as const;

/** Previous criteria — used only for transitional protection (apply the higher). */
export const OLD_PERF_WEIGHTS = {
  pts: 0.6,
  ontime: 0.25,
  hse: 0.15,
  att: 0,
} as const;

export type PerfInputs = {
  /** Approved task points this period (priority × effort). */
  pts: number;
  /** Highest peer pts in the same scope (denominator). */
  maxPts: number;
  /** 0–100 on-time share of own tasks. */
  ontimePct: number;
  /** 0–100 safety-item closure relative to peers. */
  closurePct: number;
  /** 0–100 verified hazard/near-miss reporting relative to peers. */
  reportPct: number;
  /** 0–100 relief/cover relative to peers. */
  coverPct: number;
};

export function blendHseTerm(closurePct: number, reportPct: number) {
  return Math.round(Math.max(0, Number(closurePct) || 0) * 0.7 + Math.max(0, Number(reportPct) || 0) * 0.3);
}

export type FairHseInput = {
  /** Closed hazards attributed to this person (not the station pile). */
  hazardClosed?: number;
  /** Open + closed attributed to this person. Empty / unknown = no duty. */
  hazardTotal?: number | null;
  reportPts?: number;
  maxReportPts?: number;
  /** Open hazards this person owns. */
  assignedOpen?: number;
  /** Open incidents / observations written against this person. */
  personalNotes?: number;
};

/**
 * Empty personal ledger is credit, not failure.
 * Safety is scored only on items attributed to the person.
 * No owned hazard and no observation → 100 / 100.
 */
export function deriveFairHseRates(input: FairHseInput = {}) {
  const assignedOpen = Math.max(0, Number(input.assignedOpen) || 0);
  const notes = Math.max(0, Number(input.personalNotes) || 0);
  const closed = Math.max(0, Number(input.hazardClosed) || 0);
  const totalRaw = input.hazardTotal;
  const total = totalRaw == null || totalRaw === ("" as never)
    ? (assignedOpen + closed)
    : Math.max(0, Number(totalRaw) || 0);
  const hasDuty = assignedOpen > 0 || notes > 0 || total > 0;
  const closurePct = hasDuty && total > 0
    ? Math.round((Math.min(closed, total) / total) * 100)
    : 100;

  const reportPts = Math.max(0, Number(input.reportPts) || 0);
  const maxReport = Math.max(0, Number(input.maxReportPts) || 0);
  let reportPct = 100;
  if (assignedOpen > 0 || notes > 0) {
    reportPct = reportPts <= 0 ? 0 : (maxReport > 0 ? Math.round((reportPts / maxReport) * 100) : 100);
  } else if (reportPts > 0 && maxReport > 0) {
    reportPct = Math.max(100, Math.round((reportPts / maxReport) * 100));
  }

  const safeClosure = Math.min(100, Math.max(0, closurePct));
  const safeReport = Math.min(100, Math.max(0, reportPct));
  return {
    closurePct: safeClosure,
    reportPct: safeReport,
    hsePct: blendHseTerm(safeClosure, safeReport),
    emptyLedger: !hasDuty && reportPts <= 0,
  };
}

function samePerson(value: unknown, employeeId: string, employeeName: string) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (employeeId && raw === employeeId) return true;
  return !!(employeeName && raw.toLocaleLowerCase() === employeeName);
}

/** Count only hazards / incidents attributed to this person. */
export function countPersonalHseDuty(
  records: Array<Record<string, unknown>> | null | undefined,
  employeeId?: string | null,
  employeeName?: string | null,
) {
  const id = String(employeeId || "");
  const name = String(employeeName || "").trim().toLocaleLowerCase();
  let assignedOpen = 0;
  let assignedClosed = 0;
  let personalNotes = 0;
  for (const rec of Array.isArray(records) ? records : []) {
    for (const raw of (Array.isArray(rec.hazards) ? rec.hazards : []) as Array<Record<string, unknown>>) {
      const owned = [raw.ownerId, raw.assigneeId, raw.employeeId, raw.responsibleId, raw.owner, raw.ownerName, raw.assignee]
        .some((value) => samePerson(value, id, name));
      if (owned && !raw.closedAt) assignedOpen += 1;
      if (owned && raw.closedAt) assignedClosed += 1;
    }
    for (const raw of (Array.isArray(rec.hazardLog) ? rec.hazardLog : []) as Array<Record<string, unknown>>) {
      const owned = [raw.ownerId, raw.assigneeId, raw.employeeId, raw.responsibleId, raw.owner, raw.closedBy]
        .some((value) => samePerson(value, id, name));
      if (owned) assignedClosed += 1;
    }
    for (const raw of (Array.isArray(rec.incidentLog) ? rec.incidentLog : []) as Array<Record<string, unknown>>) {
      const onThem = [raw.employeeId, raw.involvedId, raw.againstId, raw.subjectId]
        .some((value) => samePerson(value, id, name));
      if (onThem && String(raw.status || "open") !== "closed") personalNotes += 1;
    }
  }
  return { assignedOpen, assignedClosed, personalNotes, assignedTotal: assignedOpen + assignedClosed };
}

export function scoreEmployee(input: PerfInputs) {
  const pts = Math.max(0, Number(input.pts) || 0);
  const maxPts = Math.max(1, Number(input.maxPts) || 1);
  const ontime = Math.min(100, Math.max(0, Number(input.ontimePct) || 0));
  const closure = Math.min(100, Math.max(0, Number(input.closurePct) || 0));
  const reportPct = Math.min(100, Math.max(0, Number(input.reportPct) || 0));
  const coverPct = Math.min(100, Math.max(0, Number(input.coverPct) || 0));
  const ptsPct = Math.round((pts / maxPts) * 100);
  const hse = blendHseTerm(closure, reportPct);

  const W = PERF_WEIGHTS;
  const terms = [
    Math.round(ptsPct * W.pts),
    Math.round(ontime * W.ontime),
    Math.round(hse * W.hse),
    Math.round(coverPct * W.cover),
  ];
  const newScore = terms.reduce((a, b) => a + b, 0);

  const OW = OLD_PERF_WEIGHTS;
  const oldScore =
    Math.round(ptsPct * OW.pts) +
    Math.round(ontime * OW.ontime) +
    Math.round(closure * OW.hse);

  const protectedBy = oldScore > newScore;
  const score = Math.max(newScore, oldScore);

  return {
    pts,
    ptsPct,
    ontime,
    closure,
    reportPct,
    coverPct,
    hse,
    terms,
    newScore,
    oldScore,
    score,
    protectedBy,
    weights: W,
  };
}

/** Rank a list after scoring each row; maxPts/max peers derived from the list itself. */
export function scoreBoard(
  rows: Array<{
    employeeId: string;
    name?: string;
    pts?: number;
    ontimePct?: number;
    closure?: number;
    reportPts?: number;
    coverPts?: number;
    assignedOpen?: number;
    assignedClosed?: number;
    assignedTotal?: number | null;
    hazardTotal?: number | null;
    personalNotes?: number;
  }>,
) {
  const list = Array.isArray(rows) ? rows : [];
  const maxPts = Math.max(1, ...list.map((r) => Number(r.pts) || 0), 1);
  const maxReport = Math.max(0, ...list.map((r) => Number(r.reportPts) || 0), 0);
  const maxCover = Math.max(1, ...list.map((r) => Number(r.coverPts) || 0), 1);

  const scored = list.map((r) => {
    const hse = deriveFairHseRates({
      hazardClosed: Number(r.assignedClosed) || 0,
      hazardTotal: r.assignedTotal ?? r.hazardTotal,
      reportPts: Number(r.reportPts) || 0,
      maxReportPts: maxReport,
      assignedOpen: Number(r.assignedOpen) || 0,
      personalNotes: Number(r.personalNotes) || 0,
    });
    const result = scoreEmployee({
      pts: Number(r.pts) || 0,
      maxPts,
      ontimePct: Number(r.ontimePct) || 0,
      closurePct: hse.closurePct,
      reportPct: hse.reportPct,
      coverPct: maxCover ? Math.round(((Number(r.coverPts) || 0) / maxCover) * 100) : 0,
    });
    return {
      employeeId: r.employeeId,
      name: r.name || r.employeeId,
      ...result,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((row, i) => ({ ...row, rank: i + 1 }));
}
