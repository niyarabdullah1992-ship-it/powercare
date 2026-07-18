import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const managerRoles = ["director", "ops_manager", "pgm", "station_manager"];
const seniorRoles = ["owner", "director", "ops_manager"];
const expenseTypes = ["travel", "accommodation", "fuel", "overtime_meals", "tools_equipment", "training"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const platformUser = await base44.auth.me().catch(() => null);
    let auth = null;
    if (platformUser?.role === "admin" && body.companyId) auth = { companyId: body.companyId, userId: body.userId || null, role: "owner", name: platformUser.full_name || "Admin", stationId: null, managedStations: [] };
    if (!auth && body.sessionToken && body.companyId) {
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: body.sessionToken, companyId: body.companyId });
      const session = sessions[0];
      if (session && new Date(session.expiresAt).getTime() > Date.now()) {
        if (session.role === "owner") auth = { companyId: body.companyId, userId: session.userId || null, role: "owner", name: "Owner", stationId: null, managedStations: [] };
        else {
          const employees = await base44.asServiceRole.entities.Employee.filter({ companyId: body.companyId, employeeId: session.userId });
          const employee = employees[0];
          if (employee) auth = { companyId: body.companyId, userId: employee.employeeId, role: employee.role, name: employee.name, stationId: employee.stationId || null, managedStations: employee.managedStations || [] };
        }
      }
    }
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const isManager = managerRoles.includes(auth.role) || auth.role === "owner";
    const isFinance = auth.role === "financial_officer" || auth.role === "owner";
    const visibleStations = seniorRoles.includes(auth.role) ? null : auth.role === "pgm" ? auth.managedStations : auth.role === "station_manager" ? [auth.stationId, ...auth.managedStations].filter(Boolean) : [];

    if (body.action === "list") {
      const claims = await base44.asServiceRole.entities.ExpenseClaim.filter({ companyId: auth.companyId }, "-created_date", 500);
      const visible = isFinance || seniorRoles.includes(auth.role) ? claims : isManager ? claims.filter((claim) => visibleStations.includes(claim.stationId)) : claims.filter((claim) => claim.requesterId === auth.userId);
      return Response.json({ claims: visible, canManagerReview: isManager, canFinanceReview: isFinance });
    }

    if (body.action === "submit") {
      const amount = Number(body.amount); const stationId = auth.stationId || body.stationId;
      if (!auth.userId || !stationId || !expenseTypes.includes(body.expenseType) || amount <= 0 || !body.expenseDate || !body.receiptUrl) return Response.json({ error: "Invalid expense data" }, { status: 400 });
      await base44.asServiceRole.entities.ExpenseClaim.create({ companyId: auth.companyId, requesterId: auth.userId, requesterName: auth.name, stationId, expenseType: body.expenseType, amount, currency: "SAR", expenseDate: body.expenseDate, description: String(body.description || ""), receiptUrl: String(body.receiptUrl), status: "submitted", managerReviewedBy: null, managerReviewedAt: null, financeReviewedBy: null, financeReviewedAt: null });
      return Response.json({ ok: true });
    }

    if (body.action === "managerReview") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const claims = await base44.asServiceRole.entities.ExpenseClaim.filter({ id: body.claimId, companyId: auth.companyId }); const claim = claims[0];
      const inScope = seniorRoles.includes(auth.role) || visibleStations.includes(claim?.stationId);
      if (!claim || claim.status !== "submitted" || !inScope || !["manager_approved", "manager_rejected"].includes(body.decision)) return Response.json({ error: "Expense cannot be reviewed" }, { status: 400 });
      await base44.asServiceRole.entities.ExpenseClaim.update(claim.id, { status: body.decision, managerReviewedBy: auth.userId || auth.name, managerReviewedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (body.action === "financeReview") {
      if (!isFinance) return Response.json({ error: "Forbidden" }, { status: 403 });
      const claims = await base44.asServiceRole.entities.ExpenseClaim.filter({ id: body.claimId, companyId: auth.companyId }); const claim = claims[0];
      if (!claim || claim.status !== "manager_approved" || !["finance_approved", "finance_rejected"].includes(body.decision)) return Response.json({ error: "Expense is not ready for final review" }, { status: 400 });
      await base44.asServiceRole.entities.ExpenseClaim.update(claim.id, { status: body.decision, financeReviewedBy: auth.userId || auth.name, financeReviewedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Expenses error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});