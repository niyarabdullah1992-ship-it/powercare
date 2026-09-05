/** Expenses / operating budget — station spend vs limit; receipt before approve.
 *  Design: NiroVera Platform.dc.html (expenses / budgets / claims).
 */

export const WATCH_PCT = 85;
export const NEAR_LIMIT_PCT = 95;
export const PAYOUT_SLA_HOURS = 48;

export type BudgetTag = "on_track" | "watch" | "near_limit" | "over";

export type StationBudgetLike = {
  stationId: string;
  stationName?: string;
  limit: number;
  currency?: string;
};

export type ExpenseClaimLike = {
  id?: string;
  ref?: string;
  title: string;
  owner?: string;
  ownerId?: string | null;
  stationId: string;
  amount: number;
  currency?: string;
  receiptUrl?: string | null;
  status?: "pending" | "approved" | "rejected" | "paid";
  submittedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  rejectReason?: string | null;
  companyId?: string;
};

export function clampPct(spent: number, limit: number) {
  const lim = Number(limit) || 0;
  if (lim <= 0) return Number(spent) > 0 ? 100 : 0;
  return Math.min(999, Math.round((Math.max(0, Number(spent) || 0) / lim) * 100));
}

/** Tag from consumption % — design: 88% watch, 97% near limit. */
export function deriveBudgetTag(pct: number): BudgetTag {
  const p = Number(pct) || 0;
  if (p >= 100) return "over";
  if (p >= NEAR_LIMIT_PCT) return "near_limit";
  if (p >= WATCH_PCT) return "watch";
  return "on_track";
}

export function approvedSpendForStation(claims: ExpenseClaimLike[], stationId: string) {
  return claims
    .filter((c) => c.stationId === stationId && (c.status === "approved" || c.status === "paid"))
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
}

export function enrichBudget(budget: StationBudgetLike, claims: ExpenseClaimLike[] = []) {
  const limit = Math.max(0, Number(budget.limit) || 0);
  const spent = approvedSpendForStation(claims, budget.stationId);
  const remaining = Math.max(0, limit - spent);
  const pct = clampPct(spent, limit);
  const tag = deriveBudgetTag(pct);
  return {
    ...budget,
    limit,
    spent,
    remaining,
    pct,
    tag,
    currency: String(budget.currency || "SAR").toUpperCase(),
  };
}

export function deriveCompanyBudget(budgets: StationBudgetLike[] = [], claims: ExpenseClaimLike[] = []) {
  const rows = budgets.map((b) => enrichBudget(b, claims));
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const limit = rows.reduce((s, r) => s + r.limit, 0);
  return {
    rows,
    spent,
    limit,
    pct: clampPct(spent, limit),
    nearLimitCount: rows.filter((r) => r.tag === "near_limit" || r.tag === "over").length,
    watchCount: rows.filter((r) => r.tag === "watch").length,
  };
}

export function hoursSince(iso: string | null | undefined, nowMs = Date.now()) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, (nowMs - t) / (1000 * 60 * 60));
}

/** Approved but unpaid past 48h — design dashboard yellow alert. */
export function isDelayedPayout(claim: ExpenseClaimLike, nowMs = Date.now()) {
  if (claim.status !== "approved") return false;
  return hoursSince(claim.approvedAt, nowMs) >= PAYOUT_SLA_HOURS;
}

export function enrichClaim(claim: ExpenseClaimLike, nowMs = Date.now()) {
  const amount = Math.max(0, Number(claim.amount) || 0);
  const status = claim.status || "pending";
  const hasReceipt = !!(claim.receiptUrl && String(claim.receiptUrl).trim());
  return {
    ...claim,
    amount,
    status,
    hasReceipt,
    delayed: isDelayedPayout({ ...claim, status, amount }, nowMs),
    currency: String(claim.currency || "SAR").toUpperCase(),
  };
}

export function deriveExpenseAlert(claims: ExpenseClaimLike[] = [], nowMs = Date.now()) {
  const enriched = claims.map((c) => enrichClaim(c, nowMs));
  const pending = enriched.filter((c) => c.status === "pending");
  const delayed = enriched.filter((c) => c.delayed);
  const missingReceipt = pending.filter((c) => !c.hasReceipt);
  return {
    pendingCount: pending.length,
    delayedPayoutCount: delayed.length,
    missingReceiptCount: missingReceipt.length,
  };
}

export function checkSubmitClaimGate(input: {
  title?: string;
  stationId?: string;
  amount?: number;
  receiptUrl?: string | null;
}) {
  const title = String(input.title || "").trim();
  const stationId = String(input.stationId || "").trim();
  const amount = Number(input.amount);
  if (!title) {
    return {
      ok: false as const,
      error: "TITLE_REQUIRED",
      reason: "عنوان المطالبة مطلوب.",
      reasonEn: "Claim title is required.",
    };
  }
  if (!stationId) {
    return {
      ok: false as const,
      error: "STATION_REQUIRED",
      reason: "الفرع مطلوبة.",
      reasonEn: "Station is required.",
    };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false as const,
      error: "AMOUNT_REQUIRED",
      reason: "المبلغ يجب أن يكون أكبر من صفر.",
      reasonEn: "Amount must be greater than zero.",
    };
  }
  if (!input.receiptUrl || !String(input.receiptUrl).trim()) {
    return {
      ok: false as const,
      error: "RECEIPT_REQUIRED",
      reason: "الإيصال مطلوب قبل تقديم المطالبة.",
      reasonEn: "A receipt is required before submitting the claim.",
    };
  }
  return { ok: true as const, title, stationId, amount };
}

export function checkApproveClaimGate(
  claim: ExpenseClaimLike | null | undefined,
  budget: StationBudgetLike | null | undefined,
  claims: ExpenseClaimLike[] = [],
) {
  if (!claim) {
    return {
      ok: false as const,
      error: "CLAIM_NOT_FOUND",
      reason: "المطالبة غير موجودة.",
      reasonEn: "Claim not found.",
    };
  }
  if (claim.status && claim.status !== "pending") {
    return {
      ok: false as const,
      error: "ALREADY_DECIDED",
      reason: "المطالبة حُسمت مسبقًا.",
      reasonEn: "Claim already decided.",
    };
  }
  if (!claim.receiptUrl || !String(claim.receiptUrl).trim()) {
    return {
      ok: false as const,
      error: "RECEIPT_REQUIRED",
      reason: "لا اعتماد بلا إيصال مرفق.",
      reasonEn: "Cannot approve without a receipt attachment.",
    };
  }
  if (!budget) {
    return {
      ok: false as const,
      error: "BUDGET_MISSING",
      reason: "لا ميزانية لهذا الفرع.",
      reasonEn: "No budget configured for this station.",
    };
  }
  const spent = approvedSpendForStation(claims, claim.stationId);
  const amount = Number(claim.amount) || 0;
  const limit = Number(budget.limit) || 0;
  if (limit > 0 && spent + amount > limit) {
    return {
      ok: false as const,
      error: "BUDGET_EXCEEDED",
      reason: `تجاوز ميزانية الفرع — المتبقي ${Math.max(0, limit - spent)}.`,
      reasonEn: `Station budget exceeded — remaining ${Math.max(0, limit - spent)}.`,
    };
  }
  return { ok: true as const };
}

export function checkRejectClaimGate(claim: ExpenseClaimLike | null | undefined) {
  if (!claim) {
    return {
      ok: false as const,
      error: "CLAIM_NOT_FOUND",
      reason: "المطالبة غير موجودة.",
      reasonEn: "Claim not found.",
    };
  }
  if (claim.status && claim.status !== "pending") {
    return {
      ok: false as const,
      error: "ALREADY_DECIDED",
      reason: "المطالبة حُسمت مسبقًا.",
      reasonEn: "Claim already decided.",
    };
  }
  return { ok: true as const };
}

export function checkMarkPaidGate(claim: ExpenseClaimLike | null | undefined) {
  if (!claim) {
    return {
      ok: false as const,
      error: "CLAIM_NOT_FOUND",
      reason: "المطالبة غير موجودة.",
      reasonEn: "Claim not found.",
    };
  }
  if (claim.status !== "approved") {
    return {
      ok: false as const,
      error: "NOT_APPROVED",
      reason: "الصرف بعد الاعتماد فقط.",
      reasonEn: "Payout only after approval.",
    };
  }
  return { ok: true as const };
}
