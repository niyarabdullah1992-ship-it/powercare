/** Complaints / anonymous reports — escalation chain, SLA, rate limits.
 *  Design: NiroVera Platform.dc.html (complaints / rateLimits / escalation chain).
 *  Reuses the same chain shape as src/lib/escalation.js (level 0 = station manager).
 */

export const DEFAULT_RATE_LIMITS = {
  day: 3,
  week: 10,
  month: 30,
} as const;

export const RATE_WINDOW_MS = {
  day: 86_400_000,
  week: 86_400_000 * 7,
  month: 86_400_000 * 30,
} as const;

/** Response-time SLA (hours) by priority — clock resets on each escalate. */
export const RESPONSE_HOURS_BY_PRIORITY: Record<string, number> = {
  high: 24,
  medium: 48,
  low: 96,
};

/** Fallback chain when company has no custom handlers (mirrors design CHAIN). */
export const DEFAULT_CHAIN_IDS = [
  "station_manager",
  "hr_supervisor",
  "region_manager",
  "ops_director",
] as const;

export type ComplaintKind = "anonymous" | "safety" | "suggestion" | "facilities" | "public";
export type ComplaintPriority = "high" | "medium" | "low";
export type ComplaintStatus = "open" | "closed" | "rejected";

export type EscalationTier = {
  id: string;
  labelAr: string;
  labelEn: string;
  handlerIds: string[];
};

export type ComplaintLike = {
  id?: string;
  companyId?: string;
  kind?: ComplaintKind | string;
  type?: "complaint" | "suggestion" | string;
  anonymous?: boolean;
  anonymousId?: string | null;
  title: string;
  message?: string | null;
  stationId?: string | null;
  stationName?: string | null;
  priority?: ComplaintPriority | string;
  status?: ComplaintStatus | string;
  escalationLevel?: number;
  /** When the current level's response clock started (created or last escalate). */
  levelSinceAt?: string | null;
  createdAt?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  reporterName?: string | null; // null/empty for anonymous
  responseHours?: number | null; // override
  autoEscalated?: boolean;
  lastEscalationReason?: string | null;
  satisfaction?: number | null; // 0–100 when closed
};

export type RateLimits = {
  day: number;
  week: number;
  month: number;
};

export type RateUsage = {
  day: number;
  week: number;
  month: number;
};

const TIER_LABELS: Record<string, { ar: string; en: string }> = {
  station_manager: { ar: "مدير المحطة", en: "Station Manager" },
  hr_supervisor: { ar: "مشرف الموارد البشرية", en: "HR Supervisor" },
  region_manager: { ar: "مدير المنطقة", en: "Region Manager" },
  ops_director: { ar: "مدير العمليات", en: "Ops Director" },
  safety: { ar: "منسق السلامة", en: "Safety Coordinator" },
  facilities: { ar: "إدارة المرافق", en: "Facilities" },
};

export function normalizeRateLimits(raw?: Partial<RateLimits> | null): RateLimits {
  return {
    day: Math.max(1, Number(raw?.day ?? DEFAULT_RATE_LIMITS.day) || DEFAULT_RATE_LIMITS.day),
    week: Math.max(1, Number(raw?.week ?? DEFAULT_RATE_LIMITS.week) || DEFAULT_RATE_LIMITS.week),
    month: Math.max(1, Number(raw?.month ?? DEFAULT_RATE_LIMITS.month) || DEFAULT_RATE_LIMITS.month),
  };
}

/** Build default 4-tier chain; optional station-manager name for label. */
export function defaultEscalationChain(stationManagerName?: string | null): EscalationTier[] {
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

/**
 * Derive chain from org/handler ids (manual complaintEscalationChain).
 * Falls back to default tiers when empty — same rule as escalation.js.
 */
export function deriveEscalationChain(
  handlerIds: string[] = [],
  employees: Array<{ id: string; name?: string }> = [],
  stationManagerName?: string | null,
): EscalationTier[] {
  const ids = (handlerIds || []).filter(Boolean);
  if (!ids.length) return defaultEscalationChain(stationManagerName);
  return ids.map((empId) => {
    const emp = employees.find((e) => e.id === empId);
    const name = emp?.name || empId;
    return {
      id: empId,
      labelAr: name,
      labelEn: name,
      handlerIds: [empId],
    };
  });
}

export function stageCount(chain: EscalationTier[] = []) {
  return Math.max(1, chain.length || DEFAULT_CHAIN_IDS.length);
}

export function clampLevel(level: number, chainLen: number) {
  const max = Math.max(0, chainLen - 1);
  return Math.min(max, Math.max(0, Number(level) || 0));
}

export function responseHoursFor(report: ComplaintLike) {
  if (report.responseHours != null && Number.isFinite(Number(report.responseHours))) {
    return Math.max(1, Number(report.responseHours));
  }
  const pri = String(report.priority || "medium");
  return RESPONSE_HOURS_BY_PRIORITY[pri] ?? RESPONSE_HOURS_BY_PRIORITY.medium;
}

export function hoursSince(iso: string | null | undefined, nowMs = Date.now()) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, (nowMs - t) / (1000 * 60 * 60));
}

export function clockStartAt(report: ComplaintLike) {
  return report.levelSinceAt || report.createdAt || null;
}

/** Hours remaining until SLA breach (negative = overdue). */
export function slaHoursLeft(report: ComplaintLike, nowMs = Date.now()) {
  if (report.status === "closed") return null;
  const budget = responseHoursFor(report);
  const used = hoursSince(clockStartAt(report), nowMs);
  return Math.round((budget - used) * 10) / 10;
}

export function isSlaBreached(report: ComplaintLike, nowMs = Date.now()) {
  if (report.status === "closed" || report.status === "rejected") return false;
  const left = slaHoursLeft(report, nowMs);
  return left != null && left < 0;
}

export function isAtTop(report: ComplaintLike, chainLen: number) {
  return clampLevel(Number(report.escalationLevel) || 0, chainLen) >= chainLen - 1;
}

export function buildEscalationSteps(
  report: ComplaintLike,
  chain: EscalationTier[],
) {
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

export function enrichComplaint(
  report: ComplaintLike,
  chain: EscalationTier[] = defaultEscalationChain(),
  nowMs = Date.now(),
) {
  const len = stageCount(chain);
  const level = clampLevel(Number(report.escalationLevel) || 0, len);
  const status = (report.status === "closed" || report.status === "rejected"
    ? report.status
    : "open") as ComplaintStatus;
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

export function deriveComplaintStats(
  reports: ComplaintLike[],
  chain: EscalationTier[] = defaultEscalationChain(),
  nowMs = Date.now(),
) {
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
      ? Math.round(
        open.reduce((s, r) => s + hoursSince(clockStartAt(r), nowMs), 0) / open.length,
      )
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

export function countFilingsInWindow(
  filedAts: Array<string | null | undefined>,
  windowMs: number,
  nowMs = Date.now(),
) {
  return filedAts.filter((iso) => {
    const t = Date.parse(String(iso || ""));
    return Number.isFinite(t) && nowMs - t < windowMs;
  }).length;
}

export function checkRateLimitGate(
  usage: RateUsage,
  limits: Partial<RateLimits> | null | undefined = DEFAULT_RATE_LIMITS,
) {
  const lim = normalizeRateLimits(limits);
  if (usage.day >= lim.day) {
    return {
      ok: false as const,
      error: "RATE_LIMIT_DAY",
      reason: `بلغت حد البلاغات اليومي (${lim.day}).`,
      reasonEn: `Daily anonymous report limit reached (${lim.day}).`,
      limit: lim.day,
      used: usage.day,
    };
  }
  if (usage.week >= lim.week) {
    return {
      ok: false as const,
      error: "RATE_LIMIT_WEEK",
      reason: `بلغت حد البلاغات الأسبوعي (${lim.week}).`,
      reasonEn: `Weekly anonymous report limit reached (${lim.week}).`,
      limit: lim.week,
      used: usage.week,
    };
  }
  if (usage.month >= lim.month) {
    return {
      ok: false as const,
      error: "RATE_LIMIT_MONTH",
      reason: `بلغت حد البلاغات الشهري (${lim.month}).`,
      reasonEn: `Monthly anonymous report limit reached (${lim.month}).`,
      limit: lim.month,
      used: usage.month,
    };
  }
  return { ok: true as const, limits: lim };
}

export function checkFileAnonymousGate(opts: {
  message?: string | null;
  usage: RateUsage;
  limits?: Partial<RateLimits> | null;
}) {
  const message = String(opts.message || "").trim();
  if (!message) {
    return {
      ok: false as const,
      error: "MESSAGE_REQUIRED",
      reason: "نص البلاغ مطلوب.",
      reasonEn: "Report message is required.",
    };
  }
  const rate = checkRateLimitGate(opts.usage, opts.limits);
  if (!rate.ok) return rate;
  return { ok: true as const, message: message.slice(0, 5000), limits: rate.limits };
}

export function checkEscalateGate(
  report: ComplaintLike | null | undefined,
  chain: EscalationTier[],
  opts: { actorId?: string | null; isHandler?: boolean; forceSla?: boolean } = {},
) {
  if (!report) {
    return {
      ok: false as const,
      error: "REPORT_NOT_FOUND",
      reason: "البلاغ غير موجود.",
      reasonEn: "Report not found.",
    };
  }
  if (report.status === "closed") {
    return {
      ok: false as const,
      error: "ALREADY_CLOSED",
      reason: "البلاغ مغلق ولا يُصعَّد.",
      reasonEn: "Report is already closed.",
    };
  }
  const len = stageCount(chain);
  const level = clampLevel(Number(report.escalationLevel) || 0, len);
  if (level >= len - 1) {
    return {
      ok: false as const,
      error: "AT_TOP_OF_CHAIN",
      reason: "البلاغ عند أعلى مستوى في السلسلة.",
      reasonEn: "Report is at the top of the escalation chain.",
    };
  }
  // Manual escalate requires current-level handler (unless SLA sweep).
  if (!opts.forceSla && opts.isHandler === false) {
    return {
      ok: false as const,
      error: "NOT_HANDLER",
      reason: "لست معالجًا لهذا المستوى — لا تصعيد يدوي.",
      reasonEn: "You are not a handler at this level — cannot escalate manually.",
    };
  }
  const nextTier = chain[level + 1];
  const isDefaultRoleTier = !!nextTier
    && (DEFAULT_CHAIN_IDS as readonly string[]).includes(nextTier.id);
  // Custom handler chain: next tier must name at least one employee.
  if (
    !opts.forceSla
    && nextTier
    && !isDefaultRoleTier
    && Array.isArray(nextTier.handlerIds)
    && nextTier.handlerIds.length === 0
  ) {
    return {
      ok: false as const,
      error: "NO_HANDLER_AT_LEVEL",
      reason: "لا معالج معيَّن في المستوى التالي.",
      reasonEn: "No handler assigned at the next escalation level.",
    };
  }
  return {
    ok: true as const,
    nextLevel: level + 1,
    reason: opts.forceSla ? "SLA_BREACH" : "MANUAL",
  };
}

export function checkCloseGate(
  report: ComplaintLike | null | undefined,
  opts: { isHandler?: boolean } = {},
) {
  if (!report) {
    return {
      ok: false as const,
      error: "REPORT_NOT_FOUND",
      reason: "البلاغ غير موجود.",
      reasonEn: "Report not found.",
    };
  }
  if (report.status === "closed") {
    return {
      ok: false as const,
      error: "ALREADY_CLOSED",
      reason: "البلاغ مغلق مسبقًا.",
      reasonEn: "Report is already closed.",
    };
  }
  if (opts.isHandler === false) {
    return {
      ok: false as const,
      error: "NOT_HANDLER",
      reason: "لست معالجًا لهذا البلاغ.",
      reasonEn: "You are not a handler for this report.",
    };
  }
  return { ok: true as const };
}

/**
 * Apply SLA auto-escalation for open breached reports.
 * Returns mutated copies + count of escalations performed.
 */
export function applySlaAutoEscalate(
  reports: ComplaintLike[],
  chain: EscalationTier[],
  nowMs = Date.now(),
) {
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
