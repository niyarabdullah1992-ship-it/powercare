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
    const getUnitByQr = async (qr) => (await base44.asServiceRole.entities.InventoryUnit.filter({ companyId: auth.companyId, qrCode: qr }))[0];
    const balances = (item) => Array.isArray(item.locationBalances) ? item.locationBalances.map((entry) => ({ locationId: entry.locationId, quantity: Number(entry.quantity) || 0 })) : [];
    const adjustBalance = (item, stationId, delta) => {
      const next = balances(item); const index = next.findIndex((entry) => entry.locationId === stationId);
      if (index < 0) next.push({ locationId: stationId, quantity: Math.max(0, delta) });
      else { const value = next[index].quantity + delta; if (value < 0) throw new Error("Insufficient stock"); next[index].quantity = value; }
      return next;
    };
    const movement = async (data) => await base44.asServiceRole.entities.StockMovement.create({ companyId: auth.companyId, performedBy: auth.userId || auth.name, notes: "", ...data });

    if (body.action === "list") {
      const [items, units, movements, requests, employees] = await Promise.all([
        base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId }, "-updated_date", 500),
        base44.asServiceRole.entities.InventoryUnit.filter({ companyId: auth.companyId }, "-updated_date", 500),
        base44.asServiceRole.entities.StockMovement.filter({ companyId: auth.companyId }, "-created_date", 300),
        base44.asServiceRole.entities.MaterialRequest.filter({ companyId: auth.companyId }, "-created_date", 300),
        base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId }),
      ]);
      const scopedItems = items.filter((item) => seniorRoles.includes(auth.role) || visible.has(item.currentLocationId) || balances(item).some((entry) => visible.has(entry.locationId)));
      const itemIds = new Set(scopedItems.map((item) => item.id));
      const scopedRequests = requests.filter((request) => auth.manager ? visible.has(request.stationId) || seniorRoles.includes(auth.role) : request.requesterId === auth.userId);
      return Response.json({ items: scopedItems, units: units.filter((unit) => itemIds.has(unit.itemId)), movements: movements.filter((entry) => itemIds.has(entry.itemId)), requests: scopedRequests, stations: stations.filter((station) => seniorRoles.includes(auth.role) || visible.has(station.stationId)), transferStations: auth.manager ? stations : [], employees, canManage: auth.manager });
    }

    if (body.action === "createItem") {
      const denied = managerGuard(); if (denied) return denied;
      const name = String(body.name || "").trim(); const itemCode = String(body.itemCode || "").trim();
      const mode = body.trackingMode; const minimum = Number(body.minimumStock || 0); const locationId = body.locationId;
      if (!name || !itemCode || !["quantity", "serialized"].includes(mode) || !ensureStation(locationId) || minimum < 0) return Response.json({ error: "Invalid item data" }, { status: 400 });
      const duplicate = await base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId, itemCode });
      if (duplicate.length) return Response.json({ error: "Item code already exists" }, { status: 409 });
      const qrCode = `PC-ITEM:${auth.companyId}:${itemCode}`;
      const initialQty = mode === "quantity" ? Math.max(0, Number(body.quantity || 0)) : 0;
      const item = await base44.asServiceRole.entities.InventoryItem.create({ companyId: auth.companyId, itemCode, name, trackingMode: mode, serialNumber: mode === "serialized" ? String(body.serialNumber || "").trim() || null : null, currentLocationId: locationId, minimumStock: minimum, quantity: initialQty, locationBalances: mode === "quantity" ? [{ locationId, quantity: initialQty }] : [], qrCode });
      if (mode === "serialized" && body.serialNumber) {
        const unitCode = crypto.randomUUID();
        await base44.asServiceRole.entities.InventoryUnit.create({ companyId: auth.companyId, itemId: item.id, unitCode, serialNumber: String(body.serialNumber).trim(), locationId, status: "available", assignedEmployeeId: null, qrCode: `PC-UNIT:${auth.companyId}:${unitCode}` });
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: 1 });
      }
      return Response.json({ ok: true });
    }

    if (body.action === "request") {
      const item = await getItem(body.itemId); const quantity = Number(body.quantity);
      const stationId = auth.stationId || body.stationId;
      if (!item || !stationId || !allStationIds.includes(stationId) || quantity < 1 || (item.trackingMode === "serialized" && quantity !== 1)) return Response.json({ error: "Invalid request" }, { status: 400 });
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
      let unitId = null;
      if (item.trackingMode === "serialized") {
        const unit = await getUnitByQr(body.qrCode); if (!unit || unit.itemId !== item.id || unit.status !== "available" || unit.locationId !== request.stationId) return Response.json({ error: "Scanned unit is unavailable at this station" }, { status: 400 });
        await base44.asServiceRole.entities.InventoryUnit.update(unit.id, { status: "issued", assignedEmployeeId: request.requesterId }); unitId = unit.id;
        const available = await base44.asServiceRole.entities.InventoryUnit.filter({ companyId: auth.companyId, itemId: item.id, status: "available" }); await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: available.length });
      } else {
        if (body.qrCode !== item.qrCode) return Response.json({ error: "Scanned code does not match the requested item" }, { status: 400 });
        const next = adjustBalance(item, request.stationId, -request.quantity); await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: Math.max(0, item.quantity - request.quantity), locationBalances: next });
      }
      await movement({ itemId: item.id, unitId, movementType: "issue", quantity: request.quantity, fromLocationId: request.stationId, toLocationId: null, employeeId: request.requesterId, requestId: request.id });
      await base44.asServiceRole.entities.MaterialRequest.update(request.id, { status: "issued", issuedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (["receive", "return", "transfer"].includes(body.action)) {
      const denied = managerGuard(); if (denied) return denied;
      const item = await getItem(body.itemId); if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      const quantity = Number(body.quantity || 1); let unitId = null;
      if (!Number.isFinite(quantity) || quantity <= 0) return Response.json({ error: "Quantity must be greater than zero" }, { status: 400 });
      if (body.action === "receive") {
        if (!ensureStation(body.toLocationId)) return Response.json({ error: "Invalid destination" }, { status: 400 });
        if (item.trackingMode === "serialized") {
          const serial = String(body.serialNumber || "").trim(); if (!serial) return Response.json({ error: "Serial number required" }, { status: 400 });
          const exists = await base44.asServiceRole.entities.InventoryUnit.filter({ companyId: auth.companyId, serialNumber: serial }); if (exists.length) return Response.json({ error: "Serial number already exists" }, { status: 409 });
          const unitCode = crypto.randomUUID(); const unit = await base44.asServiceRole.entities.InventoryUnit.create({ companyId: auth.companyId, itemId: item.id, unitCode, serialNumber: serial, locationId: body.toLocationId, status: "available", assignedEmployeeId: null, qrCode: `PC-UNIT:${auth.companyId}:${unitCode}` }); unitId = unit.id;
          await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: item.quantity + 1, currentLocationId: body.toLocationId });
        } else { const next = adjustBalance(item, body.toLocationId, quantity); await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: item.quantity + quantity, locationBalances: next, currentLocationId: body.toLocationId }); }
        await movement({ itemId: item.id, unitId, movementType: "receive", quantity: item.trackingMode === "serialized" ? 1 : quantity, fromLocationId: null, toLocationId: body.toLocationId, employeeId: null, requestId: null });
      }
      if (body.action === "return") {
        if (!ensureStation(body.toLocationId)) return Response.json({ error: "Invalid destination" }, { status: 400 });
        if (item.trackingMode === "serialized") { const unit = await getUnitByQr(body.qrCode); if (!unit || unit.itemId !== item.id || unit.status !== "issued") return Response.json({ error: "Issued unit required" }, { status: 400 }); await base44.asServiceRole.entities.InventoryUnit.update(unit.id, { status: "available", locationId: body.toLocationId, assignedEmployeeId: null }); unitId = unit.id; await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: item.quantity + 1 }); }
        else { if (body.qrCode !== item.qrCode) return Response.json({ error: "QR mismatch" }, { status: 400 }); const next = adjustBalance(item, body.toLocationId, quantity); await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: item.quantity + quantity, locationBalances: next }); }
        await movement({ itemId: item.id, unitId, movementType: "return", quantity: item.trackingMode === "serialized" ? 1 : quantity, fromLocationId: null, toLocationId: body.toLocationId, employeeId: body.employeeId || null, requestId: null });
      }
      if (body.action === "transfer") {
        if (body.fromLocationId === body.toLocationId) return Response.json({ error: "لا يمكن النقل إلى المحطة نفسها" }, { status: 400 });
        if (!ensureStation(body.fromLocationId) || !allStationIds.includes(body.toLocationId)) return Response.json({ error: "Invalid transfer" }, { status: 400 });
        if (item.trackingMode === "serialized") { const unit = await getUnitByQr(body.qrCode); if (!unit || unit.itemId !== item.id || unit.status !== "available" || unit.locationId !== body.fromLocationId) return Response.json({ error: "Unit is not available at source" }, { status: 400 }); await base44.asServiceRole.entities.InventoryUnit.update(unit.id, { locationId: body.toLocationId }); unitId = unit.id; }
        else { let next = adjustBalance(item, body.fromLocationId, -quantity); next = (() => { const clone = { ...item, locationBalances: next }; return adjustBalance(clone, body.toLocationId, quantity); })(); await base44.asServiceRole.entities.InventoryItem.update(item.id, { locationBalances: next, currentLocationId: body.toLocationId }); }
        await movement({ itemId: item.id, unitId, movementType: "transfer", quantity: item.trackingMode === "serialized" ? 1 : quantity, fromLocationId: body.fromLocationId, toLocationId: body.toLocationId, employeeId: null, requestId: null });
      }
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Inventory error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});