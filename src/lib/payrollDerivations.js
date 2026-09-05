/** Client mirror of base44/shared/payrollDerivations.ts */

export const SHIFT_HOURS_PER_DAY = 8;
export const DAYS_PER_MONTH = 30;
export const OT_RATE = 1.5;
export const WPS_DEADLINE_DAY = 3;
/** Article 90 — deductions may not exceed half the contractual monthly wage. */
export const ARTICLE_90_CAP = 0.5;

export function parseMonth(month) {
  const m = String(month || "").match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

export function isoLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function hourlyFromBase(base) {
  const b = Number(base) || 0;
  if (b <= 0) return 0;
  return b / (DAYS_PER_MONTH * SHIFT_HOURS_PER_DAY);
}

export function overtimePay(base, overtimeHours) {
  const hours = Math.max(0, Number(overtimeHours) || 0);
  return Math.round(hourlyFromBase(base) * OT_RATE * hours * 100) / 100;
}

export function lineGross(line) {
  const ot = line.overtimePay != null
    ? Number(line.overtimePay) || 0
    : overtimePay(Number(line.base) || 0, Number(line.overtimeHours) || 0);
  return (Number(line.base) || 0) + (Number(line.allowances) || 0) + (Number(line.bonus) || 0) + ot;
}

export function lineNet(line) {
  return lineGross(line) - (Number(line.deductions) || 0);
}

export function contractWage(line) {
  return (Number(line.base) || 0) + (Number(line.allowances) || 0);
}

export function article90MaxDeduction(line) {
  return Math.round(contractWage(line) * ARTICLE_90_CAP * 100) / 100;
}

export function checkArticle90Gate(line) {
  const wage = contractWage(line);
  const deductions = Number(line.deductions) || 0;
  if (wage <= 0) return { ok: true, wage, deductions, max: 0 };
  const max = article90MaxDeduction(line);
  if (deductions <= max) return { ok: true, wage, deductions, max };
  return {
    ok: false,
    error: "ARTICLE_90_EXCEEDED",
    reason: `مجموع الخصومات (${deductions.toLocaleString()} ر.س) يتجاوز نصف الأجر (${max.toLocaleString()} ر.س) — المادة 90 من نظام العمل.`,
    reasonEn: `Total deductions (${deductions} SAR) exceed half the contractual wage (${max} SAR) — Labour Law Art. 90.`,
    wage,
    deductions,
    max,
  };
}

export function lineIssues(line) {
  const issues = [];
  if (!Number.isFinite(Number(line?.base)) || Number(line.base) < 0 || Number(line.base) <= 0) issues.push("BASE_REQUIRED");
  for (const field of ["allowances", "bonus", "deductions", "overtimeHours"]) {
    const v = line?.[field];
    if (v != null && (!Number.isFinite(Number(v)) || Number(v) < 0)) issues.push("INVALID_AMOUNTS");
  }
  if (lineNet(line) <= 0) issues.push("NET_REQUIRED");
  if (!checkArticle90Gate(line).ok) issues.push("ARTICLE_90_EXCEEDED");
  const currency = String(line?.currency || "SAR").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) issues.push("CURRENCY_REQUIRED");
  return [...new Set(issues)];
}

export function qiwaMatches(line) {
  if (line.qiwaWage == null || !Number.isFinite(Number(line.qiwaWage))) return false;
  const expected = (Number(line.base) || 0) + (Number(line.allowances) || 0);
  return Math.abs(expected - Number(line.qiwaWage)) < 1;
}

export function enrichLine(line) {
  const otHours = Math.max(0, Number(line.overtimeHours) || 0);
  const otPay = overtimePay(Number(line.base) || 0, otHours);
  return {
    ...line,
    overtimeHours: otHours,
    overtimePay: otPay,
    gross: lineGross({ ...line, overtimePay: otPay }),
    net: lineNet({ ...line, overtimePay: otPay }),
    qiwaMatched: qiwaMatches(line),
    contractWage: contractWage(line),
    article90Max: article90MaxDeduction(line),
    issues: lineIssues({ ...line, overtimePay: otPay }),
  };
}

export function deriveStationBreakdown(items = []) {
  const by = new Map();
  for (const raw of items) {
    const line = enrichLine(raw);
    const sid = line.stationId || "__unassigned__";
    const row = by.get(sid) || { stationId: sid, heads: 0, base: 0, allowances: 0, overtime: 0, deductions: 0, total: 0 };
    row.heads += 1;
    row.base += Number(line.base) || 0;
    row.allowances += Number(line.allowances) || 0;
    row.overtime += line.overtimePay;
    row.deductions += Number(line.deductions) || 0;
    row.total += line.net;
    by.set(sid, row);
  }
  return [...by.values()].map((r) => ({ ...r, baseAndAllowances: r.base + r.allowances }));
}

export function deriveRunTotals(items = []) {
  const enriched = items.map(enrichLine);
  return {
    heads: enriched.length,
    baseAndAllowances: enriched.reduce((s, i) => s + (Number(i.base) || 0) + (Number(i.allowances) || 0), 0),
    overtime: enriched.reduce((s, i) => s + i.overtimePay, 0),
    deductions: enriched.reduce((s, i) => s + (Number(i.deductions) || 0), 0),
    total: enriched.reduce((s, i) => s + i.net, 0),
    qiwaMatched: enriched.filter((i) => i.qiwaMatched).length,
    qiwaTotal: enriched.length,
    issueCount: enriched.filter((i) => i.issues.length > 0).length,
    otRule: "ARTICLE_107_150",
    deductionCapRule: "ARTICLE_90_50",
  };
}

export function wpsDeadline(month) {
  const p = parseMonth(month);
  if (!p) return null;
  let y = p.year;
  let m = p.month + 1;
  if (m > 12) { m = 1; y += 1; }
  return `${y}-${String(m).padStart(2, "0")}-${String(WPS_DEADLINE_DAY).padStart(2, "0")}`;
}

export function isWpsLate(month, now = new Date()) {
  const due = wpsDeadline(month);
  if (!due) return false;
  const [y, mo, d] = due.split("-").map(Number);
  const deadline = new Date(y, mo - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today.getTime() > deadline.getTime();
}

export function checkApprovePayrollGate(run) {
  if (!run) return { ok: false, error: "RUN_NOT_FOUND", reason: "مسير الرواتب غير موجود.", reasonEn: "Payroll run not found." };
  if (run.status === "approved" || run.status === "sent") {
    return { ok: false, error: "ALREADY_APPROVED", reason: "المسير معتمد بالفعل.", reasonEn: "This run is already approved." };
  }
  const items = run.items || [];
  if (!items.length) {
    return { ok: false, error: "EMPTY_RUN", reason: "لا اعتماد لمسير بلا بنود.", reasonEn: "Cannot approve an empty payroll run." };
  }
  const bad = items.map(enrichLine).filter((i) => i.issues.length > 0);
  if (bad.length) {
    return {
      ok: false,
      error: "ITEM_ISSUES",
      reason: `${bad.length} بندًا فيه خلل يمنع الاعتماد.`,
      reasonEn: `${bad.length} line(s) have issues that block approval.`,
      count: bad.length,
    };
  }
  return { ok: true };
}

export function checkSendWpsGate(run, now = new Date()) {
  if (!run) return { ok: false, error: "RUN_NOT_FOUND", reason: "مسير الرواتب غير موجود.", reasonEn: "Payroll run not found." };
  if (run.status === "sent" || run.wpsSentAt) {
    return { ok: false, error: "ALREADY_SENT", reason: "ملف حماية الأجور بُني بالفعل.", reasonEn: "The WPS file has already been built." };
  }
  if (run.status !== "approved") {
    return { ok: false, error: "RUN_NOT_APPROVED", reason: "لا بناء لملف WPS قبل اعتماد المسير.", reasonEn: "Cannot build the WPS file before the run is approved." };
  }
  const items = (run.items || []).map(enrichLine);
  const mismatches = items.filter((i) => !i.qiwaMatched);
  if (mismatches.length) {
    return {
      ok: false,
      error: "QIWA_MISMATCH",
      reason: `مبالغ ${mismatches.length} موظفًا لا تطابق عقود قوى — يُمنع بناء الملف.`,
      reasonEn: `${mismatches.length} employee amount(s) do not match Qiwa contracts — file build blocked.`,
      count: mismatches.length,
      matched: items.length - mismatches.length,
      total: items.length,
    };
  }
  return { ok: true, late: isWpsLate(run.month, now), deadline: wpsDeadline(run.month) };
}

/**
 * Monthly wage-protection procedure used by the payroll workspace.
 * prepare → review (Art. 90 / 107) → approve → Mudad/WPS (day-3 deadline).
 */
export function payrollCycleState({ hasRun, heads = 0, issueCount = 0, status = "", wpsLate = false } = {}) {
  const prepared = Boolean(hasRun && heads > 0);
  const reviewed = prepared && issueCount === 0;
  const approved = status === "approved" || status === "sent";
  const sent = status === "sent";
  const steps = [
    { key: "prepare", tab: "run", done: prepared },
    { key: "review", tab: "lines", done: reviewed },
    { key: "approve", tab: "run", done: approved },
    { key: "protect", tab: "wps", done: sent, warn: Boolean(wpsLate) && !sent },
  ];
  const current = steps.find((step) => !step.done) || steps[3];
  return { steps, currentKey: current.key, prepared, reviewed, approved, sent };
}

export function deriveWpsStatus(run, now = new Date()) {
  if (!run) return { status: "missing", late: false, deadline: null, matchLabel: "0/0" };
  const totals = deriveRunTotals(run.items || []);
  const late = isWpsLate(run.month, now);
  const sent = run.status === "sent" || !!run.wpsSentAt;
  return {
    status: sent ? "sent" : run.status === "approved" ? "ready" : "awaiting_approval",
    late,
    deadline: wpsDeadline(run.month),
    matched: totals.qiwaMatched,
    total: totals.qiwaTotal,
    matchLabel: `${totals.qiwaMatched}/${totals.qiwaTotal}`,
  };
}
