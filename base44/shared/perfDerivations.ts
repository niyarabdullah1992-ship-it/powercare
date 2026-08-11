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
  }>,
) {
  const list = Array.isArray(rows) ? rows : [];
  const maxPts = Math.max(1, ...list.map((r) => Number(r.pts) || 0), 1);
  const maxClosure = Math.max(1, ...list.map((r) => Number(r.closure) || 0), 1);
  const maxReport = Math.max(1, ...list.map((r) => Number(r.reportPts) || 0), 1);
  const maxCover = Math.max(1, ...list.map((r) => Number(r.coverPts) || 0), 1);

  const scored = list.map((r) => {
    const result = scoreEmployee({
      pts: Number(r.pts) || 0,
      maxPts,
      ontimePct: Number(r.ontimePct) || 0,
      closurePct: maxClosure ? Math.round(((Number(r.closure) || 0) / maxClosure) * 100) : 0,
      reportPct: maxReport ? Math.round(((Number(r.reportPts) || 0) / maxReport) * 100) : 0,
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
