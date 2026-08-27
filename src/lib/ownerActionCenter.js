/**
 * Owner Action Center — the single "what needs my decision now" derivation.
 *
 * A company owner does not want twenty dashboards; they want one ranked queue
 * that pulls every section together — money at stake, trust to close, people to
 * answer, risk to contain — ordered by impact, each row linking to the section
 * that resolves it. This is a pure function over the company `data` workspace so
 * it can be unit-tested and reused by the dashboard, the assistant, and alerts.
 */

const PENDING_EXPENSE = new Set(["submitted", "manager_approved", "pending"]);
const POSTED_EXPENSE = new Set(["approved", "finance_approved", "manager_approved", "posted", "paid"]);
const PENDING_SIGNING = new Set(["pending", "awaiting", "in_progress"]);
const OPEN_COMPLAINT = new Set(["open", "new", ""]);

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

function ymd(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function netPay(item) {
  return num(item.base) + num(item.allowances) + num(item.bonus) - num(item.deductions);
}

/**
 * @param {object} data       company workspace object
 * @param {object} [options]
 * @param {Set|Array} [options.stationIds]  optional station scope; omit for company-wide
 * @param {Date} [options.now]
 * @returns {{ items: Array, categories: number, totalItems: number, moneyAtStake: number }}
 */
export function deriveOwnerActions(data, { stationIds = null, now = new Date() } = {}) {
  const scope = stationIds instanceof Set
    ? stationIds
    : Array.isArray(stationIds) ? new Set(stationIds.map(String)) : null;
  const inScope = (id) => !scope || (id != null && scope.has(String(id)));
  const nowMs = +now;
  const dateKey = ymd(now);

  // People — leave requests awaiting a decision.
  const employees = (data?.employees || []).filter((e) => !scope || inScope(e.stationId));
  const leavePending = employees.reduce(
    (sum, e) => sum + (e.leaveRequests || []).filter((r) => r.status === "pending").length,
    0,
  );

  // Operations — tasks overdue or burning their deadline.
  const tasks = (data?.tasks || []).filter((t) => !scope || inScope(t.stationId || t.station_id));
  let overdue = 0;
  let dueSoon = 0;
  for (const t of tasks) {
    if (t.status === "completed" || t.approvedAt) continue;
    const deadline = t.dueAt || t.dueDate || t.endDate || t.end_date;
    if (!deadline) continue;
    const ms = +new Date(deadline);
    if (!Number.isFinite(ms)) continue;
    if (ms < nowMs) overdue += 1;
    else if (ms <= nowMs + 3 * 86400000) dueSoon += 1;
  }

  // Operations — daily reports not yet approved (pending) or never filed (missing).
  const stations = (data?.stations || []).filter((s) => !scope || inScope(s.id));
  const dailyRows = (data?.reports || []).filter(
    (r) => r && (r.kind === "daily" || r.type === "daily" || !r.kind) && (!r.dateKey || r.dateKey === dateKey),
  );
  const dailyByStation = new Map(dailyRows.map((r) => [String(r.stationId), r]));
  let dailyMissing = 0;
  let dailyPending = 0;
  for (const s of stations) {
    const row = dailyByStation.get(String(s.id));
    if (!row) dailyMissing += 1;
    else if (!row.approved && row.status !== "approved") dailyPending += 1;
  }
  const dailyOutstanding = dailyMissing + dailyPending;

  // Money — expenses awaiting approval and their riyal exposure.
  const allExpenses = data?.expenses || data?.expenseClaims || [];
  const expenseStations = (x) => (Array.isArray(x.stationIds) && x.stationIds.length ? x.stationIds : [x.stationId]);
  const scopedExpenses = allExpenses.filter((x) => !scope || expenseStations(x).some(inScope));
  const pendingExpenses = scopedExpenses.filter((x) => PENDING_EXPENSE.has(x.status));
  const pendingExpenseAmount = pendingExpenses.reduce(
    (sum, x) => sum + num(x.amount ?? x.afterTaxAmount ?? x.beforeTaxAmount),
    0,
  );

  // Money — stations whose posted spend has passed their budget ceiling.
  let overBudget = 0;
  for (const b of (data?.stationBudgets || []).filter((b) => !scope || inScope(b.stationId))) {
    const limit = num(b.limit);
    if (limit <= 0) continue;
    const spent = allExpenses
      .filter((x) => expenseStations(x).map(String).includes(String(b.stationId)) && POSTED_EXPENSE.has(x.status))
      .reduce((sum, x) => sum + num(x.amount ?? x.afterTaxAmount), 0);
    if (spent > limit) overBudget += 1;
  }

  // Money — payroll runs prepared but not yet paid, with wage-protection timing.
  const readyRuns = (data?.payrollRuns || []).filter((r) => {
    const status = String(r.status || "").toLowerCase();
    const items = Array.isArray(r.items) ? r.items : [];
    const allPaid = items.length > 0 && items.every((i) => i.paid);
    return (status === "ready" || status === "approved") && !r.paidAt && !allPaid;
  });
  let payrollAmount = 0;
  for (const run of readyRuns) {
    for (const item of run.items || []) {
      if (item.paid) continue;
      if (scope && !inScope(item.employeeStationId)) continue;
      payrollAmount += netPay(item);
    }
  }
  const wageProtectionOverdue = readyRuns.length > 0 && now.getDate() > 3;

  // Trust — signature requests waiting, and sealed proofs ready for client disclosure.
  const pendingSigning = (data?.signatureRequests || [])
    .filter((s) => !scope || s.stationId == null || inScope(s.stationId))
    .filter((s) => PENDING_SIGNING.has(String(s.status || "").toLowerCase())).length;
  const sealedProofs = (data?.workProofs || [])
    .filter((p) => !scope || inScope(p.stationId))
    .filter((p) => (p.status === "sealed" || p.sealId) && p.status !== "accepted" && !p.acceptedAt && !p.clientProofId)
    .length;

  // Care — open safety hazards (critical when red or high-severity) and employee voice.
  let openHazards = 0;
  let criticalHazards = 0;
  for (const s of (data?.safety || []).filter((s) => !scope || inScope(s.stationId))) {
    const open = (s.hazards || []).filter((h) => !h.closedAt);
    openHazards += open.length;
    if (s.level === "red") criticalHazards += 1;
    criticalHazards += open.filter((h) => num(h.severity) >= 4).length;
  }
  const openComplaints = [...(data?.anonymousReports || []), ...(data?.publicReports || [])]
    .filter((c) => (!scope || inScope(c.stationId)) && OPEN_COMPLAINT.has(String(c.status ?? "").toLowerCase()))
    .length;

  const items = [];
  const push = (item) => { if (item.count > 0) items.push(item); };

  push({
    key: "payroll", section: "money", to: "/app/payroll",
    severity: wageProtectionOverdue ? "high" : "medium",
    count: readyRuns.length, amount: payrollAmount,
    titleAr: "مسير رواتب جاهز للاعتماد", titleEn: "Payroll run ready to approve",
    detailAr: wageProtectionOverdue ? "تجاوز اليوم 3 — حماية الأجور معرّضة" : "اعتمده قبل اليوم 3 لحماية الأجور",
    detailEn: wageProtectionOverdue ? "Past day 3 — wage protection at risk" : "Approve before day 3 for wage protection",
  });
  push({
    key: "expenses", section: "money", to: "/app/expenses",
    severity: overBudget > 0 ? "high" : "medium",
    count: pendingExpenses.length, amount: pendingExpenseAmount,
    titleAr: "مصروفات بانتظار الاعتماد", titleEn: "Expenses awaiting approval",
    detailAr: overBudget > 0 ? `${overBudget} فرع تجاوز ميزانيته` : "بانتظار الاعتماد المالي",
    detailEn: overBudget > 0 ? `${overBudget} station(s) over budget` : "Awaiting finance approval",
  });
  push({
    key: "tasks", section: "ops", to: overdue > 0 ? "/app/escalation" : "/app/tasks",
    severity: overdue > 0 ? "high" : "medium",
    count: overdue + dueSoon, amount: null,
    titleAr: "مهام تحتاج متابعة", titleEn: "Tasks needing attention",
    detailAr: overdue > 0 ? `${overdue} متأخرة عن موعدها` : "تقترب من موعدها",
    detailEn: overdue > 0 ? `${overdue} overdue` : "Due soon",
  });
  push({
    key: "safety", section: "care", to: "/app/safety",
    severity: criticalHazards > 0 ? "high" : "medium",
    count: openHazards, amount: null,
    titleAr: "مخاطر سلامة مفتوحة", titleEn: "Open safety hazards",
    detailAr: criticalHazards > 0 ? `${criticalHazards} حرجة تحتاج إغلاقًا فوريًا` : "بانتظار الإغلاق",
    detailEn: criticalHazards > 0 ? `${criticalHazards} critical` : "Awaiting closure",
  });
  push({
    key: "leave", section: "people", to: "/app/leave",
    severity: "medium", count: leavePending, amount: null,
    titleAr: "طلبات إجازة بانتظار القرار", titleEn: "Leave requests awaiting a decision",
    detailAr: "الرصيد يُخصم عند الاعتماد فقط", detailEn: "Balance is deducted only on approval",
  });
  push({
    key: "daily", section: "ops", to: "/app/daily-report",
    severity: "medium", count: dailyOutstanding, amount: null,
    titleAr: "تقارير يومية مستحقة", titleEn: "Daily reports outstanding",
    detailAr: dailyMissing > 0 ? `${dailyMissing} فرع لم يرفع بعد` : "بانتظار الاعتماد",
    detailEn: dailyMissing > 0 ? `${dailyMissing} station(s) not filed` : "Awaiting approval",
  });
  push({
    key: "signing", section: "trust", to: "/app/signing",
    severity: "medium", count: pendingSigning, amount: null,
    titleAr: "طلبات توقيع بانتظارك", titleEn: "Signatures waiting for you",
    detailAr: "أكمل سلسلة الختم للمستندات", detailEn: "Close the seal chain on documents",
  });
  push({
    key: "complaints", section: "care", to: "/app/complaints",
    severity: "medium", count: openComplaints, amount: null,
    titleAr: "بلاغات صوت الموظف مفتوحة", titleEn: "Open employee-voice reports",
    detailAr: "اقتراح · شكوى · بلاغ مجهول", detailEn: "Suggestion · complaint · anonymous report",
  });
  push({
    key: "proof", section: "trust", to: "/app/work-proof",
    severity: "low", count: sealedProofs, amount: null,
    titleAr: "إثباتات مختومة جاهزة لإفصاح العميل", titleEn: "Sealed proofs ready for client disclosure",
    detailAr: "أفصح الحقول المسموح بها وأصدر رابط تحقق", detailEn: "Disclose allowed fields and issue a verify link",
  });

  items.sort((a, b) => {
    if (SEVERITY_RANK[a.severity] !== SEVERITY_RANK[b.severity]) return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if ((b.amount || 0) !== (a.amount || 0)) return (b.amount || 0) - (a.amount || 0);
    return b.count - a.count;
  });

  return {
    items,
    categories: items.length,
    totalItems: items.reduce((sum, i) => sum + i.count, 0),
    moneyAtStake: pendingExpenseAmount + payrollAmount,
  };
}
