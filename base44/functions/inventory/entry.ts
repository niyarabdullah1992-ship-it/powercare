import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

const managerRoles = ["director", "ops_manager", "pgm", "station_manager", "inventory_keeper"];
const seniorRoles = ["owner", "director", "ops_manager"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const platformUser = await base44.auth.me().catch(() => null);
    let auth = null;
    if (platformUser?.role === "admin" && body.companyId) auth = { companyId: body.companyId, userId: body.userId || null, role: "owner", name: platformUser.full_name || "Admin", manager: true };
    if (!auth && body.sessionToken && body.companyId) {
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: body.sessionToken, companyId: body.companyId });
      const session = sessions[0];
      if (session && new Date(session.expiresAt).getTime() > Date.now()) {
        if (session.role === "owner") auth = { companyId: body.companyId, userId: session.userId || null, role: "owner", name: "Owner", manager: true, stationId: null, managedStations: [] };
        else {
          const employees = await base44.asServiceRole.entities.Employee.filter({ companyId: body.companyId, employeeId: session.userId });
          const employee = employees[0];
          if (employee) auth = { companyId: body.companyId, userId: employee.employeeId, role: employee.role, name: employee.name, manager: managerRoles.includes(employee.role), stationId: employee.stationId || null, managedStations: employee.managedStations || [] };
        }
      }
    }
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const stations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
    const allStationIds = stations.map((station) => station.stationId);
    const visibleIds = seniorRoles.includes(auth.role) ? allStationIds : auth.role === "pgm" ? auth.managedStations : auth.role === "station_manager" ? [auth.stationId, ...auth.managedStations].filter(Boolean) : [auth.stationId].filter(Boolean);
    const visible = new Set(visibleIds);
    const ensureStation = (id) => allStationIds.includes(id) && (seniorRoles.includes(auth.role) || visible.has(id));
    const managerGuard = () => auth.manager ? null : Response.json({ error: "Forbidden" }, { status: 403 });
    const getItem = async (id) => (await base44.asServiceRole.entities.InventoryItem.filter({ id, companyId: auth.companyId }))[0];
    const balances = (item) => Array.isArray(item.locationBalances) ? item.locationBalances.map((entry) => ({ locationId: entry.locationId, quantity: Number(entry.quantity) || 0 })) : [];
    const adjustBalance = (item, stationId, delta) => {
      const next = balances(item); const index = next.findIndex((entry) => entry.locationId === stationId);
      if (index < 0) next.push({ locationId: stationId, quantity: Math.max(0, delta) });
      else { const value = next[index].quantity + delta; if (value < 0) throw new Error("Insufficient stock"); next[index].quantity = value; }
      return next;
    };
    const movement = async (data) => await base44.asServiceRole.entities.StockMovement.create({ companyId: auth.companyId, performedBy: auth.userId || auth.name, notes: "", ...data });

    if (body.action === "list") {
      const [items, movements, requests, employees] = await Promise.all([
        base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId }, "-updated_date", 500),
        base44.asServiceRole.entities.StockMovement.filter({ companyId: auth.companyId }, "-created_date", 300),
        base44.asServiceRole.entities.MaterialRequest.filter({ companyId: auth.companyId }, "-created_date", 300),
        base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId }),
      ]);
      const scopedItems = items.filter((item) => seniorRoles.includes(auth.role) || visible.has(item.currentLocationId) || balances(item).some((entry) => visible.has(entry.locationId)));
      const itemIds = new Set(scopedItems.map((item) => item.id));
      const scopedRequests = requests.filter((request) => auth.manager ? visible.has(request.stationId) || seniorRoles.includes(auth.role) : request.requesterId === auth.userId);
      return Response.json({ items: scopedItems, movements: movements.filter((entry) => itemIds.has(entry.itemId)), requests: scopedRequests, stations: stations.filter((station) => seniorRoles.includes(auth.role) || visible.has(station.stationId)), transferStations: auth.manager ? stations : [], employees, canManage: auth.manager });
    }

    if (body.action === "deleteItem") {
      const denied = managerGuard(); if (denied) return denied;
      const item = await getItem(body.itemId);
      if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      await Promise.all([
        base44.asServiceRole.entities.StockMovement.deleteMany({ companyId: auth.companyId, itemId: item.id }),
        base44.asServiceRole.entities.MaterialRequest.deleteMany({ companyId: auth.companyId, itemId: item.id }),
      ]);
      await base44.asServiceRole.entities.InventoryItem.delete(item.id);
      return Response.json({ ok: true });
    }

    if (body.action === "createItem") {
      const denied = managerGuard(); if (denied) return denied;
      const name = String(body.name || "").trim(); const itemCode = String(body.itemCode || "").trim();
      const minimum = Number(body.minimumStock || 0); const locationId = body.locationId;
      if (!name || !itemCode || !ensureStation(locationId) || minimum < 0) return Response.json({ error: "Invalid item data" }, { status: 400 });
      const duplicate = await base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId, itemCode });
      if (duplicate.length) return Response.json({ error: "Item code already exists" }, { status: 409 });
      const qrCode = `PC-ITEM:${auth.companyId}:${itemCode}`;
      const initialQty = Math.max(0, Number(body.quantity || 0));
      await base44.asServiceRole.entities.InventoryItem.create({ companyId: auth.companyId, itemCode, name, currentLocationId: locationId, minimumStock: minimum, quantity: initialQty, locationBalances: [{ locationId, quantity: initialQty }], qrCode });
      return Response.json({ ok: true });
    }

    if (body.action === "request") {
      const item = await getItem(body.itemId); const quantity = Number(body.quantity);
      const stationId = auth.stationId || body.stationId;
      if (!item || !stationId || !allStationIds.includes(stationId) || quantity < 1) return Response.json({ error: "Invalid request" }, { status: 400 });
      await base44.asServiceRole.entities.MaterialRequest.create({ companyId: auth.companyId, requesterId: auth.userId, stationId, itemId: item.id, quantity, notes: String(body.notes || ""), status: "pending", supervisorId: null, reviewedBy: null, reviewedAt: null, issuedAt: null });
      return Response.json({ ok: true });
    }

    if (body.action === "reviewRequest") {
      const denied = managerGuard(); if (denied) return denied;
      const rows = await base44.asServiceRole.entities.MaterialRequest.filter({ id: body.requestId, companyId: auth.companyId }); const request = rows[0];
      if (!request || request.status !== "pending" || !ensureStation(request.stationId) || !["approved", "rejected"].includes(body.decision)) return Response.json({ error: "Request cannot be reviewed" }, { status: 400 });
      await base44.asServiceRole.entities.MaterialRequest.update(request.id, { status: body.decision, reviewedBy: auth.userId || auth.name, reviewedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (body.action === "issueRequest") {
      const denied = managerGuard(); if (denied) return denied;
      if (!body.requestId) return Response.json({ error: "لا يمكن الصرف: لا يوجد طلب معتمد" }, { status: 400 });
      let requests = [];
      try { requests = await base44.asServiceRole.entities.MaterialRequest.filter({ id: body.requestId, companyId: auth.companyId }); }
      catch { return Response.json({ error: "لا يمكن الصرف: لا يوجد طلب معتمد" }, { status: 400 }); }
      const request = requests[0];
      if (!request || request.status !== "approved" || !ensureStation(request.stationId)) return Response.json({ error: "لا يمكن الصرف: لا يوجد طلب معتمد" }, { status: 400 });
      const previousIssues = await base44.asServiceRole.entities.StockMovement.filter({ companyId: auth.companyId, requestId: request.id, movementType: "issue" });
      if (previousIssues.length) return Response.json({ error: "لا يمكن الصرف: تم صرف هذا الطلب مسبقاً" }, { status: 409 });
      const item = await getItem(request.itemId); if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      if (item.trackingMode === "quantity") {
        const available = balances(item).find((entry) => entry.locationId === request.stationId)?.quantity || 0;
        if (available < Number(request.quantity)) return Response.json({ error: "لا يمكن الصرف: الكمية المطلوبة تتجاوز الرصيد المتاح" }, { status: 400 });
      }
      if (body.qrCode !== item.qrCode) return Response.json({ error: "Scanned code does not match the requested item" }, { status: 400 });
      const next = adjustBalance(item, request.stationId, -request.quantity);
      await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: Math.max(0, item.quantity - request.quantity), locationBalances: next });
      await movement({ itemId: item.id, unitId: null, movementType: "issue", quantity: request.quantity, fromLocationId: request.stationId, toLocationId: null, employeeId: request.requesterId, requestId: request.id });
      await base44.asServiceRole.entities.MaterialRequest.update(request.id, { status: "issued", issuedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (["receive", "return", "transfer"].includes(body.action)) {
      const denied = managerGuard(); if (denied) return denied;
      const item = await getItem(body.itemId); if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      const quantity = Number(body.quantity || 1);
      if (!Number.isFinite(quantity) || quantity <= 0) return Response.json({ error: "Quantity must be greater than zero" }, { status: 400 });
      if (body.action === "receive") {
        if (!ensureStation(body.toLocationId)) return Response.json({ error: "Invalid destination" }, { status: 400 });
        const next = adjustBalance(item, body.toLocationId, quantity);
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: item.quantity + quantity, locationBalances: next, currentLocationId: body.toLocationId });
        await movement({ itemId: item.id, unitId: null, movementType: "receive", quantity, fromLocationId: null, toLocationId: body.toLocationId, employeeId: null, requestId: null });
      }
      if (body.action === "return") {
        if (!ensureStation(body.toLocationId)) return Response.json({ error: "Invalid destination" }, { status: 400 });
        if (body.qrCode !== item.qrCode) return Response.json({ error: "QR mismatch" }, { status: 400 });
        const next = adjustBalance(item, body.toLocationId, quantity);
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: item.quantity + quantity, locationBalances: next });
        await movement({ itemId: item.id, unitId: null, movementType: "return", quantity, fromLocationId: null, toLocationId: body.toLocationId, employeeId: body.employeeId || null, requestId: null });
      }
      if (body.action === "transfer") {
        if (body.fromLocationId === body.toLocationId) return Response.json({ error: "لا يمكن النقل إلى المحطة نفسها" }, { status: 400 });
        if (!ensureStation(body.fromLocationId) || !allStationIds.includes(body.toLocationId)) return Response.json({ error: "Invalid transfer" }, { status: 400 });
        let next = adjustBalance(item, body.fromLocationId, -quantity);
        next = adjustBalance({ ...item, locationBalances: next }, body.toLocationId, quantity);
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { locationBalances: next, currentLocationId: body.toLocationId });
        await movement({ itemId: item.id, unitId: null, movementType: "transfer", quantity, fromLocationId: body.fromLocationId, toLocationId: body.toLocationId, employeeId: null, requestId: null });
      }
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Inventory error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});