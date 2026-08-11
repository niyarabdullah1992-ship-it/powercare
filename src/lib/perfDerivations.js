/** Client mirror of base44/shared/perfDerivations.ts */

export const PERF_WEIGHTS = { pts: 0.5, ontime: 0.25, hse: 0.15, cover: 0.1, att: 0 };
export const OLD_PERF_WEIGHTS = { pts: 0.6, ontime: 0.25, hse: 0.15, att: 0 };

export function blendHseTerm(closurePct, reportPct) {
  return Math.round(Math.max(0, Number(closurePct) || 0) * 0.7 + Math.max(0, Number(reportPct) || 0) * 0.3);
}

export function scoreEmployee({ pts = 0, maxPts = 1, ontimePct = 0, closurePct = 0, reportPct = 0, coverPct = 0 }) {
  const safeMax = Math.max(1, Number(maxPts) || 1);
  const ptsPct = Math.round((Math.max(0, Number(pts) || 0) / safeMax) * 100);
  const ontime = Math.min(100, Math.max(0, Number(ontimePct) || 0));
  const closure = Math.min(100, Math.max(0, Number(closurePct) || 0));
  const report = Math.min(100, Math.max(0, Number(reportPct) || 0));
  const cover = Math.min(100, Math.max(0, Number(coverPct) || 0));
  const hse = blendHseTerm(closure, report);
  const W = PERF_WEIGHTS;
  const terms = [
    Math.round(ptsPct * W.pts),
    Math.round(ontime * W.ontime),
    Math.round(hse * W.hse),
    Math.round(cover * W.cover),
  ];
  const newScore = terms.reduce((a, b) => a + b, 0);
  const OW = OLD_PERF_WEIGHTS;
  const oldScore = Math.round(ptsPct * OW.pts) + Math.round(ontime * OW.ontime) + Math.round(closure * OW.hse);
  const protectedBy = oldScore > newScore;
  return {
    pts: Math.max(0, Number(pts) || 0),
    ptsPct,
    ontime,
    closure,
    reportPct: report,
    coverPct: cover,
    hse,
    terms,
    newScore,
    oldScore,
    score: Math.max(newScore, oldScore),
    protectedBy,
    weights: W,
  };
}

export function scoreBoard(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const maxPts = Math.max(1, ...list.map((r) => Number(r.pts) || 0), 1);
  const maxClosure = Math.max(1, ...list.map((r) => Number(r.closure) || 0), 1);
  const maxReport = Math.max(1, ...list.map((r) => Number(r.reportPts) || 0), 1);
  const maxCover = Math.max(1, ...list.map((r) => Number(r.coverPts) || 0), 1);
  const scored = list.map((r) => ({
    employeeId: r.employeeId,
    name: r.name || r.employeeId,
    ...scoreEmployee({
      pts: Number(r.pts) || 0,
      maxPts,
      ontimePct: Number(r.ontimePct) || 0,
      closurePct: Math.round(((Number(r.closure) || 0) / maxClosure) * 100),
      reportPct: Math.round(((Number(r.reportPts) || 0) / maxReport) * 100),
      coverPct: Math.round(((Number(r.coverPts) || 0) / maxCover) * 100),
    }),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((row, i) => ({ ...row, rank: i + 1 }));
}
