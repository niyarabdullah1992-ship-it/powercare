import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const managerRoles = ["director", "ops_manager", "pgm", "station_manager"];
const seniorRoles = ["owner", "director", "ops_manager"];
const expenseTypes = ["travel", "accommodation", "fuel", "overtime_meals", "tools_equipment", "training", "other"];

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
    const allStations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
    const visibleStationIds = seniorRoles.includes(auth.role) || isFinance ? allStations.map((station) => station.stationId) : auth.role === "pgm" ? auth.managedStations : auth.role === "station_manager" ? [auth.stationId, ...auth.managedStations].filter(Boolean) : [auth.stationId].filter(Boolean);
    const claimStations = (claim) => claim.stationIds?.length ? claim.stationIds : [claim.stationId];

    if (body.action === "list") {
      const claims = await base44.asServiceRole.entities.ExpenseClaim.filter({ companyId: auth.companyId }, "-created_date", 500);
      const visible = isFinance || seniorRoles.includes(auth.role) ? claims : isManager ? claims.filter((claim) => claimStations(claim).some((id) => visibleStationIds.includes(id))) : claims.filter((claim) => claim.requesterId === auth.userId);
      const stations = allStations.filter((station) => visibleStationIds.includes(station.stationId));
      return Response.json({ claims: visible, stations, canManagerReview: isManager, canFinanceReview: isFinance, canPickStations: isManager || isFinance });
    }

    if (body.action === "submit") {
      const amount = Number(body.amount); const canPickStations = isManager || isFinance;
      let stationIds = [auth.stationId].filter(Boolean); let stationScope = "single";
      if (canPickStations && body.stationScope === "all") { stationIds = visibleStationIds; stationScope = "all"; }
      if (canPickStations && body.stationScope === "selected") { stationIds = [...new Set(Array.isArray(body.stationIds) ? body.stationIds : [])].filter((id) => visibleStationIds.includes(id)); stationScope = "selected"; }
      const customExpenseType = String(body.customExpenseType || "").trim();
      if (!auth.userId || !stationIds.length || !expenseTypes.includes(body.expenseType) || (body.expenseType === "other" && !customExpenseType) || amount <= 0 || !body.expenseDate || !body.receiptUrl) return Response.json({ error: "Invalid expense data" }, { status: 400 });
      await base44.asServiceRole.entities.ExpenseClaim.create({ companyId: auth.companyId, requesterId: auth.userId, requesterName: auth.name, stationId: stationIds[0], stationIds, stationScope, expenseType: body.expenseType, customExpenseType, amount, totalAmount: amount * stationIds.length, currency: "SAR", expenseDate: body.expenseDate, description: String(body.description || ""), receiptUrl: String(body.receiptUrl), status: "submitted", managerReviewedBy: null, managerReviewedAt: null, financeReviewedBy: null, financeReviewedAt: null });
      return Response.json({ ok: true });
    }

    if (body.action === "managerReview") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const claims = await base44.asServiceRole.entities.ExpenseClaim.filter({ id: body.claimId, companyId: auth.companyId }); const claim = claims[0];
      const inScope = seniorRoles.includes(auth.role) || claimStations(claim || {}).some((id) => visibleStationIds.includes(id));
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