/** Client mirror of base44/shared/complaintDerivations.ts
 *  Keep in sync — complaints / anonymous rate limits / SLA escalation.
 */

export const DEFAULT_RATE_LIMITS = { day: 3, week: 10, month: 30 };

export const RATE_WINDOW_MS = {
  day: 86_400_000,
  week: 86_400_000 * 7,
  month: 86_400_000 * 30,
};

export const RESPONSE_HOURS_BY_PRIORITY = {
  high: 24,
  medium: 48,
  low: 96,
};

export const DEFAULT_CHAIN_IDS = [
  "station_manager",
  "hr_supervisor",
  "region_manager",
  "ops_director",
];

const TIER_LABELS = {
  station_manager: { ar: "مدير المحطة", en: "Station Manager" },
  hr_supervisor: { ar: "مشرف الموارد البشرية", en: "HR Supervisor" },
  region_manager: { ar: "مدير المنطقة", en: "Region Manager" },
  ops_director: { ar: "مدير العمليات", en: "Ops Director" },
  safety: { ar: "منسق السلامة", en: "Safety Coordinator" },
  facilities: { ar: "إدارة المرافق", en: "Facilities" },
};

export function normalizeRateLimits(raw) {
  return {
    day: Math.max(1, Number(raw?.day ?? DEFAULT_RATE_LIMITS.day) || DEFAULT_RATE_LIMITS.day),
    week: Math.max(1, Number(raw?.week ?? DEFAULT_RATE_LIMITS.week) || DEFAULT_RATE_LIMITS.week),
    month: Math.max(1, Number(raw?.month ?? DEFAULT_RATE_LIMITS.month) || DEFAULT_RATE_LIMITS.month),
  };
}

export function defaultEscalationChain(stationManagerName) {
  return DEFAULT_CHAIN_IDS.map((id) => {
    const base = TIER_LABELS[id] || { ar: id, en: id };
    if (id === "station_manager" && stationManagerName) {
      return {
        id,
        labelAr: `مدير المحطة — ${stationManagerName}`,
        labelEn: `Station Manager — ${stationManagerName}`,
        handlerIds: [],
      };
    }
    return { id, labelAr: base.ar, labelEn: base.en, handlerIds: [] };
  });
}

export function deriveEscalationChain(handlerIds = [], employees = [], stationManagerName) {
  const ids = (handlerIds || []).filter(Boolean);
  if (!ids.length) return defaultEscalationChain(stationManagerName);
  return ids.map((empId) => {
    const emp = employees.find((e) => e.id === empId);
    const name = emp?.name || empId;
    return { id: empId, labelAr: name, labelEn: name, handlerIds: [empId] };
  });
}

export function stageCount(chain = []) {
  return Math.max(1, chain.length || DEFAULT_CHAIN_IDS.length);
}

export function clampLevel(level, chainLen) {
  const max = Math.max(0, chainLen - 1);
  return Math.min(max, Math.max(0, Number(level) || 0));
}

export function responseHoursFor(report) {
  if (report.responseHours != null && Number.isFinite(Number(report.responseHours))) {
    return Math.max(1, Number(report.responseHours));
  }
  const pri = String(report.priority || "medium");
  return RESPONSE_HOURS_BY_PRIORITY[pri] ?? RESPONSE_HOURS_BY_PRIORITY.medium;
}

export function hoursSince(iso, nowMs = Date.now()) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, (nowMs - t) / (1000 * 60 * 60));
}

export function clockStartAt(report) {
  return report.levelSinceAt || report.createdAt || null;
}

export function slaHoursLeft(report, nowMs = Date.now()) {
  if (report.status === "closed") return null;
  const budget = responseHoursFor(report);
  const used = hoursSince(clockStartAt(report), nowMs);
  return Math.round((budget - used) * 10) / 10;
}

export function isSlaBreached(report, nowMs = Date.now()) {
  if (report.status === "closed" || report.status === "rejected") return false;
  const left = slaHoursLeft(report, nowMs);
  return left != null && left < 0;
}

export function isAtTop(report, chainLen) {
  return clampLevel(Number(report.escalationLevel) || 0, chainLen) >= chainLen - 1;
}

export function buildEscalationSteps(report, chain) {
  const lvl = clampLevel(Number(report.escalationLevel) || 0, chain.length);
  return chain.map((tier, idx) => ({
    idx,
    id: tier.id,
    labelAr: tier.labelAr,
    labelEn: tier.labelEn,
    hasHandler: (tier.handlerIds || []).length > 0 || idx === 0,
    state: idx < lvl ? "done" : idx === lvl ? "current" : "pending",
  }));
}

export function enrichComplaint(report, chain = defaultEscalationChain(), nowMs = Date.now()) {
  const len = stageCount(chain);
  const level = clampLevel(Number(report.escalationLevel) || 0, len);
  const status = report.status === "closed" || report.status === "rejected" ? report.status : "open";
  const left = status === "open" ? slaHoursLeft({ ...report, status }, nowMs) : null;
  const breached = status === "open" && left != null && left < 0;
  const tier = chain[level] || chain[chain.length - 1];
  const anon = report.anonymous === true
    || report.kind === "anonymous"
    || !!report.anonymousId
    || !report.reporterName;
  return {
    ...report,
    status,
    escalationLevel: level,
    anonymous: anon,
    kind: report.kind || (anon ? "anonymous" : report.type === "suggestion" ? "suggestion" : "public"),
    responseHours: responseHoursFor(report),
    slaHoursLeft: left,
    slaBreached: breached,
    atTop: isAtTop({ ...report, escalationLevel: level }, len),
    currentTierId: tier?.id || null,
    currentTierLabelAr: tier?.labelAr || null,
    currentTierLabelEn: tier?.labelEn || null,
    steps: buildEscalationSteps({ ...report, escalationLevel: level }, chain),
    canAutoEscalate: breached && !isAtTop({ ...report, escalationLevel: level }, len),
  };
}

export function deriveComplaintStats(reports, chain = defaultEscalationChain(), nowMs = Date.now()) {
  const enriched = reports.map((r) => enrichComplaint(r, chain, nowMs));
  const open = enriched.filter((r) => r.status === "open");
  const anonOpen = open.filter((r) => r.anonymous);
  const breached = open.filter((r) => r.slaBreached);
  const closed = enriched.filter((r) => r.status === "closed");
  const monthStart = new Date(nowMs);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const closedMonth = closed.filter((r) => {
    const t = Date.parse(String(r.closedAt || ""));
    return Number.isFinite(t) && t >= monthStart.getTime();
  });
  const responseSamples = enriched
    .filter((r) => r.status === "closed" && r.createdAt && r.closedAt)
    .map((r) => hoursSince(r.createdAt, Date.parse(String(r.closedAt))));
  const avgResponse = responseSamples.length
    ? Math.round(responseSamples.reduce((a, b) => a + b, 0) / responseSamples.length)
    : open.length
      ? Math.round(open.reduce((s, r) => s + hoursSince(clockStartAt(r), nowMs), 0) / open.length)
      : 0;
  const sats = closedMonth
    .map((r) => Number(r.satisfaction))
    .filter((n) => Number.isFinite(n) && n >= 0);
  const avgSat = sats.length ? Math.round(sats.reduce((a, b) => a + b, 0) / sats.length) : null;
  return {
    openCount: open.length,
    anonymousOpen: anonOpen.length,
    avgResponseHours: avgResponse,
    breachedCount: breached.length,
    autoEscalatedOpen: open.filter((r) => r.autoEscalated).length,
    closedThisMonth: closedMonth.length,
    avgSatisfaction: avgSat,
  };
}

export function countFilingsInWindow(filedAts, windowMs, nowMs = Date.now()) {
  return filedAts.filter((iso) => {
    const t = Date.parse(String(iso || ""));
    return Number.isFinite(t) && nowMs - t < windowMs;
  }).length;
}

export function checkRateLimitGate(usage, limits = DEFAULT_RATE_LIMITS) {
  const lim = normalizeRateLimits(limits);
  if (usage.day >= lim.day) {
    return {
      ok: false,
      error: "RATE_LIMIT_DAY",
      reason: `بلغت حد البلاغات اليومي (${lim.day}).`,
      reasonEn: `Daily anonymous report limit reached (${lim.day}).`,
      limit: lim.day,
      used: usage.day,
    };
  }
  if (usage.week >= lim.week) {
    return {
      ok: false,
      error: "RATE_LIMIT_WEEK",
      reason: `بلغت حد البلاغات الأسبوعي (${lim.week}).`,
      reasonEn: `Weekly anonymous report limit reached (${lim.week}).`,
      limit: lim.week,
      used: usage.week,
    };
  }
  if (usage.month >= lim.month) {
    return {
      ok: false,
      error: "RATE_LIMIT_MONTH",
      reason: `بلغت حد البلاغات الشهري (${lim.month}).`,
      reasonEn: `Monthly anonymous report limit reached (${lim.month}).`,
      limit: lim.month,
      used: usage.month,
    };
  }
  return { ok: true, limits: lim };
}

export function checkFileAnonymousGate({ message, usage, limits } = {}) {
  const text = String(message || "").trim();
  if (!text) {
    return {
      ok: false,
      error: "MESSAGE_REQUIRED",
      reason: "نص البلاغ مطلوب.",
      reasonEn: "Report message is required.",
    };
  }
  const rate = checkRateLimitGate(usage, limits);
  if (!rate.ok) return rate;
  return { ok: true, message: text.slice(0, 5000), limits: rate.limits };
}

export function checkEscalateGate(report, chain, opts = {}) {
  if (!report) {
    return {
      ok: false,
      error: "REPORT_NOT_FOUND",
      reason: "البلاغ غير موجود.",
      reasonEn: "Report not found.",
    };
  }
  if (report.status === "closed") {
    return {
      ok: false,
      error: "ALREADY_CLOSED",
      reason: "البلاغ مغلق ولا يُصعَّد.",
      reasonEn: "Report is already closed.",
    };
  }
  const len = stageCount(chain);
  const level = clampLevel(Number(report.escalationLevel) || 0, len);
  if (level >= len - 1) {
    return {
      ok: false,
      error: "AT_TOP_OF_CHAIN",
      reason: "البلاغ عند أعلى مستوى في السلسلة.",
      reasonEn: "Report is at the top of the escalation chain.",
    };
  }
  if (!opts.forceSla && opts.isHandler === false) {
    return {
      ok: false,
      error: "NOT_HANDLER",
      reason: "لست معالجًا لهذا المستوى — لا تصعيد يدوي.",
      reasonEn: "You are not a handler at this level — cannot escalate manually.",
    };
  }
  const nextTier = chain[level + 1];
  const isDefaultRoleTier = !!nextTier && DEFAULT_CHAIN_IDS.includes(nextTier.id);
  if (
    !opts.forceSla
    && nextTier
    && !isDefaultRoleTier
    && Array.isArray(nextTier.handlerIds)
    && nextTier.handlerIds.length === 0
  ) {
    return {
      ok: false,
      error: "NO_HANDLER_AT_LEVEL",
      reason: "لا معالج معيَّن في المستوى التالي.",
      reasonEn: "No handler assigned at the next escalation level.",
    };
  }
  return {
    ok: true,
    nextLevel: level + 1,
    reason: opts.forceSla ? "SLA_BREACH" : "MANUAL",
  };
}

export function checkCloseGate(report, opts = {}) {
  if (!report) {
    return {
      ok: false,
      error: "REPORT_NOT_FOUND",
      reason: "البلاغ غير موجود.",
      reasonEn: "Report not found.",
    };
  }
  if (report.status === "closed") {
    return {
      ok: false,
      error: "ALREADY_CLOSED",
      reason: "البلاغ مغلق مسبقًا.",
      reasonEn: "Report is already closed.",
    };
  }
  if (opts.isHandler === false) {
    return {
      ok: false,
      error: "NOT_HANDLER",
      reason: "لست معالجًا لهذا البلاغ.",
      reasonEn: "You are not a handler for this report.",
    };
  }
  return { ok: true };
}

export function applySlaAutoEscalate(reports, chain, nowMs = Date.now()) {
  const nowIso = new Date(nowMs).toISOString();
  let escalated = 0;
  const next = reports.map((r) => {
    if (r.status !== "open") return r;
    if (!isSlaBreached(r, nowMs)) return r;
    const gate = checkEscalateGate(r, chain, { forceSla: true });
    if (!gate.ok) return r;
    escalated += 1;
    return {
      ...r,
      escalationLevel: gate.nextLevel,
      levelSinceAt: nowIso,
      autoEscalated: true,
      lastEscalationReason: "SLA_BREACH",
    };
  });
  return { reports: next, escalated };
}
