import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";
import {
  checkApproveClaimGate,
  checkMarkPaidGate,
  checkRejectClaimGate,
  checkSubmitClaimGate,
  deriveCompanyBudget,
  deriveExpenseAlert,
  enrichClaim,
  type ExpenseClaimLike,
  type StationBudgetLike,
} from "../../shared/expenseDerivations.ts";

const BUDGET_CATEGORY = "expenseBudget";

function requireCompanyId(companyId: unknown) {
  const id = typeof companyId === "string" ? companyId.trim() : "";
  if (!id) return null;
  return id;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

type BudgetPayload = {
  budgets: Array<StationBudgetLike & { companyId: string }>;
  claims: Array<ExpenseClaimLike & { companyId: string }>;
};

function emptyPayload(): BudgetPayload {
  return { budgets: [], claims: [] };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const action = String(body.action || "");
    const companyId = requireCompanyId(body.companyId);
    if (!companyId) {
      return Response.json({ error: "Missing companyId — record without tenant is rejected" }, { status: 400 });
    }

    const sessionAuth = await authPowerCareSession(base44, companyId, body.sessionToken);
    if (!sessionAuth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const auth = {
      companyId,
      userId: sessionAuth.userId || null,
      name: sessionAuth.name || "User",
      role: sessionAuth.role || "employee",
      stationId: sessionAuth.stationId || null,
      owner: !!sessionAuth.owner || sessionAuth.role === "owner" || sessionAuth.admin,
      admin: !!sessionAuth.admin,
    };

    const financeRoles = ["owner", "director", "ops_manager", "financial_officer", "pgm", "admin"];
    const canManage = auth.owner || auth.admin || financeRoles.includes(auth.role);

    const loadBlob = async () => {
      const rows = await base44.asServiceRole.entities.CompanyDataBlob.filter({
        companyId: auth.companyId,
        category: BUDGET_CATEGORY,
      });
      return rows[0] || null;
    };

    const loadPayload = async (): Promise<BudgetPayload> => {
      const blob = await loadBlob();
      const raw = blob?.payload && typeof blob.payload === "object" ? blob.payload : {};
      const base = emptyPayload();
      base.budgets = (Array.isArray(raw.budgets) ? raw.budgets : []).filter(
        (b: StationBudgetLike & { companyId?: string }) => b && b.companyId === auth.companyId && b.stationId,
      );
      base.claims = (Array.isArray(raw.claims) ? raw.claims : []).filter(
        (c: ExpenseClaimLike & { companyId?: string }) => c && c.companyId === auth.companyId && c.id,
      );
      return base;
    };

    const savePayload = async (payload: BudgetPayload) => {
      const blob = await loadBlob();
      if (blob) await base44.asServiceRole.entities.CompanyDataBlob.update(blob.id, { payload });
      else {
        await base44.asServiceRole.entities.CompanyDataBlob.create({
          companyId: auth.companyId,
          category: BUDGET_CATEGORY,
          payload,
        });
      }
    };

    const audit = async (actionKey: string, details: string, extra: Record<string, unknown> = {}) => {
      await base44.asServiceRole.entities.AuditLog.create({
        companyId: auth.companyId,
        action: actionKey,
        performedBy: auth.name,
        details,
        reason: extra.reason || null,
        oldValue: extra.oldValue || null,
        newValue: extra.newValue || null,
      });
    };

    const enrich = (data: BudgetPayload) => {
      const claims = data.claims.map((c) => enrichClaim(c));
      const company = deriveCompanyBudget(data.budgets, data.claims);
      return {
        ok: true,
        budgets: company.rows,
        claims,
        company,
        alert: deriveExpenseAlert(data.claims),
      };
    };

    if (action === "list") {
      const data = await loadPayload();
      return Response.json(enrich(data));
    }

    if (action === "seedDemo") {
      if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });
      const data = await loadPayload();
      if (data.budgets.length > 0 || data.claims.length > 0) {
        return Response.json(enrich(data));
      }
      const demoBudgets: Array<StationBudgetLike & { companyId: string }> = [
        { companyId: auth.companyId, stationId: "jbl1", stationName: "الجبيل 1", limit: 420000 },
        { companyId: auth.companyId, stationId: "jbl2", stationName: "الجبيل 2", limit: 380000 },
        { companyId: auth.companyId, stationId: "ynb", stationName: "ينبع", limit: 310000 },
        { companyId: auth.companyId, stationId: "rbg", stationName: "رابغ", limit: 280000 },
        { companyId: auth.companyId, stationId: "shb", stationName: "الشعيبة", limit: 250000 },
        { companyId: auth.companyId, stationId: "dmm", stationName: "الدمام", limit: 202000 },
      ];
      const now = Date.now();
      const demoClaims: Array<ExpenseClaimLike & { companyId: string }> = [
        {
          companyId: auth.companyId,
          id: uid("exp"),
          ref: "EXP-2208",
          title: "قطع غيار طارئة — مضخة التغذية",
          owner: "سعود الحربي",
          stationId: "jbl2",
          amount: 24300,
          receiptUrl: "demo://receipt/2208",
          status: "approved",
          submittedAt: new Date(now - 72 * 3600_000).toISOString(),
          approvedAt: new Date(now - 60 * 3600_000).toISOString(),
        },
        {
          companyId: auth.companyId,
          id: uid("exp"),
          ref: "EXP-2199",
          title: "وقود مركبات الصيانة — أغسطس",
          owner: "فهد القحطاني",
          stationId: "ynb",
          amount: 6420,
          receiptUrl: "demo://receipt/2199",
          status: "paid",
          submittedAt: new Date(now - 96 * 3600_000).toISOString(),
          approvedAt: new Date(now - 90 * 3600_000).toISOString(),
          paidAt: new Date(now - 80 * 3600_000).toISOString(),
        },
        {
          companyId: auth.companyId,
          id: uid("exp"),
          ref: "EXP-2211",
          title: "نقل صمام بديل من مخزون ينبع",
          owner: "خالد الزهراني",
          stationId: "jbl2",
          amount: 1850,
          receiptUrl: "demo://receipt/2211",
          status: "pending",
          submittedAt: new Date(now - 12 * 3600_000).toISOString(),
        },
        {
          companyId: auth.companyId,
          id: uid("exp"),
          ref: "EXP-2190",
          title: "إقامة فريق الصيانة — ليلتان",
          owner: "خالد الزهراني",
          stationId: "rbg",
          amount: 3200,
          receiptUrl: null,
          status: "pending",
          submittedAt: new Date(now - 24 * 3600_000).toISOString(),
        },
      ];
      // Seed jbl2 near-limit (~97%): limit 380000 → spend ~368600
      demoClaims.push({
        companyId: auth.companyId,
        id: uid("exp"),
        ref: "EXP-2100",
        title: "عقود صيانة ربع سنوية",
        owner: "عمليات",
        stationId: "jbl2",
        amount: 344300,
        receiptUrl: "demo://receipt/2100",
        status: "paid",
        submittedAt: new Date(now - 20 * 86400_000).toISOString(),
        approvedAt: new Date(now - 19 * 86400_000).toISOString(),
        paidAt: new Date(now - 18 * 86400_000).toISOString(),
      });
      // Rabigh watch (~88%)
      demoClaims.push({
        companyId: auth.companyId,
        id: uid("exp"),
        ref: "EXP-2101",
        title: "مشتريات تشغيل رابغ",
        owner: "عمليات",
        stationId: "rbg",
        amount: 246400,
        receiptUrl: "demo://receipt/2101",
        status: "paid",
        submittedAt: new Date(now - 15 * 86400_000).toISOString(),
        approvedAt: new Date(now - 14 * 86400_000).toISOString(),
        paidAt: new Date(now - 13 * 86400_000).toISOString(),
      });
      data.budgets = demoBudgets;
      data.claims = demoClaims;
      await savePayload(data);
      await audit("budget.seedDemo", "Seeded expense budget board");
      return Response.json(enrich(data));
    }

    if (!canManage) {
      return Response.json({ error: "Forbidden — finance role required" }, { status: 403 });
    }

    if (action === "setBudget") {
      const stationId = String(body.stationId || "").trim();
      const limit = Number(body.limit);
      if (!stationId || !Number.isFinite(limit) || limit < 0) {
        return Response.json({ error: "BUDGET_INVALID", reason: "محطة وحدّ ميزانية صالحان مطلوبان." }, { status: 400 });
      }
      const data = await loadPayload();
      const idx = data.budgets.findIndex((b) => b.stationId === stationId);
      const next = {
        companyId: auth.companyId,
        stationId,
        stationName: String(body.stationName || (idx >= 0 ? data.budgets[idx].stationName : stationId)),
        limit,
        currency: String(body.currency || "SAR").toUpperCase(),
      };
      if (idx >= 0) data.budgets[idx] = next;
      else data.budgets.push(next);
      await savePayload(data);
      await audit("budget.set", `Budget ${stationId}=${limit}`);
      return Response.json(enrich(data));
    }

    if (action === "submitClaim") {
      const gate = checkSubmitClaimGate(body);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      const data = await loadPayload();
      const claim: ExpenseClaimLike & { companyId: string } = {
        companyId: auth.companyId,
        id: uid("exp"),
        ref: String(body.ref || `EXP-${String(data.claims.length + 2200).padStart(4, "0")}`),
        title: gate.title,
        owner: String(body.owner || auth.name),
        ownerId: auth.userId,
        stationId: gate.stationId,
        amount: gate.amount,
        currency: String(body.currency || "SAR").toUpperCase(),
        receiptUrl: String(body.receiptUrl).trim(),
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
      data.claims.unshift(claim);
      await savePayload(data);
      await audit("budget.submitClaim", claim.ref || claim.id || "");
      return Response.json({ ...enrich(data), claim: enrichClaim(claim) });
    }

    if (action === "approve") {
      const data = await loadPayload();
      const claimId = String(body.claimId || "");
      const claim = data.claims.find((c) => c.id === claimId);
      const budget = data.budgets.find((b) => b.stationId === claim?.stationId) || null;
      const gate = checkApproveClaimGate(claim, budget, data.claims);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      claim!.status = "approved";
      claim!.approvedAt = new Date().toISOString();
      await savePayload(data);
      await audit("budget.approve", claim!.ref || claimId);
      return Response.json(enrich(data));
    }

    if (action === "reject") {
      const data = await loadPayload();
      const claimId = String(body.claimId || "");
      const claim = data.claims.find((c) => c.id === claimId);
      const gate = checkRejectClaimGate(claim);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      claim!.status = "rejected";
      claim!.rejectReason = String(body.reason || "rejected").trim() || "rejected";
      await savePayload(data);
      await audit("budget.reject", claim!.ref || claimId, { reason: claim!.rejectReason });
      return Response.json(enrich(data));
    }

    if (action === "markPaid") {
      const data = await loadPayload();
      const claimId = String(body.claimId || "");
      const claim = data.claims.find((c) => c.id === claimId);
      const gate = checkMarkPaidGate(claim);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      claim!.status = "paid";
      claim!.paidAt = new Date().toISOString();
      await savePayload(data);
      await audit("budget.markPaid", claim!.ref || claimId);
      return Response.json(enrich(data));
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("budget error", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
