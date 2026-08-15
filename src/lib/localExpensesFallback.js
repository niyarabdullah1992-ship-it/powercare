/**
 * Expenses + budget board when the `expenses` / `budget` cloud functions are down.
 */
import { getCompanyData, getSession, updateCompany } from "@/lib/store";
import {
  checkApproveClaimGate,
  checkMarkPaidGate,
  checkRejectClaimGate,
  checkSubmitClaimGate,
  deriveCompanyBudget,
  deriveExpenseAlert,
  enrichClaim,
} from "@/lib/expenseDerivations";

const TYPES = ["travel", "accommodation", "fuel", "overtime_meals", "tools_equipment", "training", "other"];
const DEFAULT_STATION_LIMIT = 50000;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function actor(companyId) {
  const session = getSession();
  const data = getCompanyData(companyId);
  const user = (data?.employees || []).find((e) => e.id === session?.userId);
  const owner = !user || user.role === "owner" || user.id === data?.ownerId || user.role === "director";
  const role = owner && user?.role !== "director" ? "owner" : (user?.role || "owner");
  return {
    companyId,
    userId: user?.id || session?.userId || "owner",
    name: user?.name || "Owner",
    role,
    owner: owner || role === "owner",
    stationId: user?.stationId || null,
    managedStations: user?.managedStations || [],
  };
}

function stationRows(data) {
  return (data?.stations || []).map((station) => ({
    ...station,
    stationId: station.stationId || station.id,
    id: station.id || station.stationId,
  }));
}

function fail(message, extra = {}) {
  const error = new Error(message);
  error.response = { data: { error: message, ...extra } };
  throw error;
}

function toExpenseStatus(status) {
  if (status === "pending") return "submitted";
  if (status === "approved") return "finance_approved";
  if (status === "rejected") return "manager_rejected";
  if (status === "paid") return "finance_approved";
  return status || "submitted";
}

function toBudgetStatus(status) {
  if (status === "submitted") return "pending";
  if (status === "manager_approved") return "pending";
  if (status === "finance_approved") return "approved";
  if (status === "manager_rejected" || status === "finance_rejected") return "rejected";
  return status || "pending";
}

function normalizeClaim(raw, stations) {
  const stationId = raw.stationId || raw.stationIds?.[0] || stations[0]?.stationId;
  const stationIds = raw.stationIds?.length ? raw.stationIds : (stationId ? [stationId] : []);
  const amount = Number(raw.afterTaxAmount ?? raw.amount) || 0;
  const status = toExpenseStatus(raw.status);
  return {
    ...raw,
    id: raw.id || uid("exp"),
    requesterId: raw.requesterId || raw.ownerId || "owner",
    requesterName: raw.requesterName || raw.owner || "—",
    stationId: stationIds[0] || stationId,
    stationIds,
    stationScope: raw.stationScope || (stationIds.length > 1 ? "selected" : "single"),
    expenseType: TYPES.includes(raw.expenseType) ? raw.expenseType : (raw.title ? "other" : "tools_equipment"),
    customExpenseType: raw.customExpenseType || (raw.expenseType === "other" || !raw.expenseType ? (raw.title || raw.description || "") : ""),
    beforeTaxAmount: Number(raw.beforeTaxAmount ?? amount) || 0,
    taxAmount: Number(raw.taxAmount) || 0,
    afterTaxAmount: amount,
    amount,
    totalAmount: Number(raw.totalAmount) || amount * Math.max(1, stationIds.length),
    currency: raw.currency || "SAR",
    expenseDate: raw.expenseDate || String(raw.createdAt || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
    description: raw.description || raw.title || "",
    receiptUrl: raw.receiptUrl || "",
    status,
    title: raw.title || raw.description || raw.customExpenseType || "مطالبة",
    ref: raw.ref || raw.id,
  };
}

function ensureLedger(data) {
  const stations = stationRows(data);
  const merged = [
    ...(Array.isArray(data.expenseClaims) ? data.expenseClaims : []),
    ...(Array.isArray(data.expenses) ? data.expenses : []),
  ];
  const byId = new Map();
  merged.forEach((raw) => {
    const claim = normalizeClaim(raw, stations);
    if (!byId.has(claim.id)) byId.set(claim.id, claim);
  });
  data.expenseClaims = [...byId.values()];
  if (!Array.isArray(data.stationBudgets) || !data.stationBudgets.length) {
    data.stationBudgets = stations.map((station) => ({
      stationId: station.stationId,
      stationName: station.name,
      limit: DEFAULT_STATION_LIMIT,
      currency: "SAR",
    }));
  }
  return data;
}

function rights(auth) {
  const manager = auth.owner || ["director", "ops_manager", "pgm", "station_manager", "admin"].includes(auth.role);
  const finance = auth.owner || ["financial_officer", "director", "ops_manager", "admin"].includes(auth.role);
  return {
    manager,
    finance,
    canPickStations: manager || finance,
  };
}

export function localExpensesCall(session, action, payload = {}) {
  const companyId = session?.companyId;
  if (!companyId) fail("Missing companyId");
  const auth = actor(companyId);
  const cap = rights(auth);

  if (action === "list") {
    const current = getCompanyData(companyId);
    const needsMigrate = !Array.isArray(current?.stationBudgets) || !current.stationBudgets.length
      || (!Array.isArray(current?.expenseClaims) && Array.isArray(current?.expenses) && current.expenses.length);
    if (needsMigrate) updateCompany(companyId, (data) => { ensureLedger(data); });
    const data = getCompanyData(companyId) || { stations: [] };
    ensureLedger(data);
    const stations = stationRows(data);
    return {
      claims: data.expenseClaims,
      stations,
      canManagerReview: cap.manager,
      canFinanceReview: cap.finance,
      canPickStations: cap.canPickStations,
    };
  }

  if (action === "submit") {
    const beforeTaxAmount = Number(payload.beforeTaxAmount);
    const taxAmount = Number(payload.taxAmount);
    const afterTaxAmount = Number(payload.afterTaxAmount);
    const quantity = payload.quantity == null || payload.quantity === "" ? null : Number(payload.quantity);
    const customExpenseType = String(payload.customExpenseType || "").trim();
    const totalsMatch = Math.abs((beforeTaxAmount + taxAmount) - afterTaxAmount) < 0.01;
    if (!TYPES.includes(payload.expenseType) || (payload.expenseType === "other" && !customExpenseType) || afterTaxAmount <= 0 || !totalsMatch || !payload.expenseDate || !payload.receiptUrl) {
      fail("Invalid expense data");
    }
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const visible = stationRows(data).map((station) => station.stationId);
      let stationIds = [auth.stationId].filter(Boolean);
      let stationScope = "single";
      if (cap.canPickStations && payload.stationScope === "all") {
        stationIds = visible;
        stationScope = "all";
      }
      if (cap.canPickStations && payload.stationScope === "selected") {
        stationIds = [...new Set(Array.isArray(payload.stationIds) ? payload.stationIds : [])].filter((id) => visible.includes(id));
        stationScope = "selected";
      }
      if (!stationIds.length) fail("Invalid expense data");
      data.expenseClaims.unshift({
        id: uid("exp"),
        ref: `EXP-${String(data.expenseClaims.length + 2200).padStart(4, "0")}`,
        requesterId: auth.userId,
        requesterName: auth.name,
        owner: auth.name,
        stationId: stationIds[0],
        stationIds,
        stationScope,
        expenseType: payload.expenseType,
        customExpenseType,
        title: customExpenseType || payload.description || "مطالبة",
        beforeTaxAmount,
        taxAmount,
        afterTaxAmount,
        quantity,
        invoiceNumber: String(payload.invoiceNumber || "").trim(),
        amount: afterTaxAmount,
        totalAmount: afterTaxAmount * stationIds.length,
        currency: "SAR",
        expenseDate: payload.expenseDate,
        description: String(payload.description || ""),
        receiptUrl: String(payload.receiptUrl),
        status: "submitted",
        submittedAt: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });
    });
    return { ok: true };
  }

  if (action === "managerReview") {
    if (!cap.manager) fail("Forbidden");
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const claim = data.expenseClaims.find((entry) => entry.id === payload.claimId);
      if (!claim || claim.status !== "submitted" || !["manager_approved", "manager_rejected"].includes(payload.decision)) {
        fail("Expense cannot be reviewed");
      }
      claim.status = payload.decision;
      claim.managerReviewedBy = auth.userId;
      claim.managerReviewedAt = new Date().toISOString();
    });
    return { ok: true };
  }

  if (action === "financeReview") {
    if (!cap.finance) fail("Forbidden");
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const claim = data.expenseClaims.find((entry) => entry.id === payload.claimId);
      if (!claim || claim.status !== "manager_approved" || !["finance_approved", "finance_rejected"].includes(payload.decision)) {
        fail("Expense is not ready for final review");
      }
      claim.status = payload.decision;
      claim.financeReviewedBy = auth.userId;
      claim.financeReviewedAt = new Date().toISOString();
      if (payload.decision === "finance_approved") claim.approvedAt = claim.financeReviewedAt;
    });
    return { ok: true };
  }

  fail("Unknown action");
  return { ok: false };
}

function budgetView(companyId) {
  const data = getCompanyData(companyId) || { stations: [] };
  ensureLedger(data);
  const claims = data.expenseClaims.map((claim) => enrichClaim({
    ...claim,
    status: claim.paidAt ? "paid" : toBudgetStatus(claim.status),
    owner: claim.owner || claim.requesterName,
    hasReceipt: !!claim.receiptUrl,
  }));
  const company = deriveCompanyBudget(data.stationBudgets, claims);
  return {
    ok: true,
    budgets: company.rows,
    claims,
    company,
    alert: deriveExpenseAlert(claims),
  };
}

export function localBudgetCall(companyId, payload = {}) {
  const action = String(payload.action || "list");
  const auth = actor(companyId);

  if (action === "list" || action === "seedDemo") {
    const current = getCompanyData(companyId);
    if (!Array.isArray(current?.stationBudgets) || !current.stationBudgets.length) {
      updateCompany(companyId, (data) => { ensureLedger(data); });
    }
    return budgetView(companyId);
  }

  if (action === "submitClaim") {
    const gate = checkSubmitClaimGate(payload);
    if (!gate.ok) fail(gate.reason || gate.error, { reason: gate.reason, reasonEn: gate.reasonEn, error: gate.error });
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      data.expenseClaims.unshift({
        id: uid("exp"),
        ref: String(payload.ref || `EXP-${String(data.expenseClaims.length + 2200).padStart(4, "0")}`),
        title: gate.title,
        owner: String(payload.owner || auth.name),
        requesterName: String(payload.owner || auth.name),
        requesterId: auth.userId,
        stationId: gate.stationId,
        stationIds: [gate.stationId],
        amount: gate.amount,
        afterTaxAmount: gate.amount,
        beforeTaxAmount: gate.amount,
        taxAmount: 0,
        currency: "SAR",
        receiptUrl: String(payload.receiptUrl).trim(),
        expenseType: "other",
        customExpenseType: gate.title,
        expenseDate: new Date().toISOString().slice(0, 10),
        status: "submitted",
        submittedAt: new Date().toISOString(),
      });
    });
    return budgetView(companyId);
  }

  if (action === "approve") {
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const claim = data.expenseClaims.find((entry) => entry.id === payload.claimId);
      const budget = data.stationBudgets.find((row) => row.stationId === claim?.stationId) || null;
      const projected = claim ? { ...claim, status: toBudgetStatus(claim.status) } : null;
      const gate = checkApproveClaimGate(projected, budget, data.expenseClaims.map((entry) => ({
        ...entry,
        status: toBudgetStatus(entry.status),
      })));
      if (!gate.ok) fail(gate.reason || gate.error, { reason: gate.reason, reasonEn: gate.reasonEn, error: gate.error });
      claim.status = "finance_approved";
      claim.approvedAt = new Date().toISOString();
    });
    return budgetView(companyId);
  }

  if (action === "reject") {
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const claim = data.expenseClaims.find((entry) => entry.id === payload.claimId);
      const gate = checkRejectClaimGate(claim ? { ...claim, status: toBudgetStatus(claim.status) } : null);
      if (!gate.ok) fail(gate.reason || gate.error, { reason: gate.reason, reasonEn: gate.reasonEn, error: gate.error });
      claim.status = "manager_rejected";
      claim.rejectReason = String(payload.reason || "rejected").trim() || "rejected";
    });
    return budgetView(companyId);
  }

  if (action === "markPaid") {
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const claim = data.expenseClaims.find((entry) => entry.id === payload.claimId);
      const gate = checkMarkPaidGate(claim ? { ...claim, status: toBudgetStatus(claim.status) } : null);
      if (!gate.ok) fail(gate.reason || gate.error, { reason: gate.reason, reasonEn: gate.reasonEn, error: gate.error });
      claim.paidAt = new Date().toISOString();
      claim.status = "finance_approved";
    });
    return budgetView(companyId);
  }

  return budgetView(companyId);
}
