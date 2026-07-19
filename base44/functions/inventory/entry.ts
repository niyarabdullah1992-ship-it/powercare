import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

const managerRoles = ["director", "ops_manager", "pgm", "station_manager", "inventory_keeper", "warehouse_manager"];
const seniorRoles = ["owner", "director", "ops_manager", "warehouse_manager"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const platformUser = await base44.auth.me().catch(() => null);
    let auth = null;
    if (platformUser?.role === "admin" && body.companyId) auth = { companyId: body.companyId, userId: body.userId || null, role: "owner", name: platformUser.full_name || "Admin", manager: true, owner: true };
    if (!auth && body.sessionToken && body.companyId) {
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: body.sessionToken, companyId: body.companyId });
      const session = sessions[0];
      if (session && new Date(session.expiresAt).getTime() > Date.now()) {
        if (session.role === "owner") auth = { companyId: body.companyId, userId: session.userId || null, role: "owner", name: "Owner", manager: true, owner: true, stationId: null, managedStations: [] };
        else {
          const employees = await base44.asServiceRole.entities.Employee.filter({ companyId: body.companyId, employeeId: session.userId });
          const employee = employees[0];
          if (employee) auth = { companyId: body.companyId, userId: employee.employeeId, role: employee.role, name: employee.name, manager: managerRoles.includes(employee.role), owner: false, stationId: employee.stationId || null, managedStations: employee.managedStations || [] };
        }
      }
    }
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Some company owners enter through their employee identity (for example after
    // switching users). Reconcile that identity with the persisted company owner
    // instead of incorrectly treating the owner as a regular employee.
    if (!auth.owner && auth.userId) {
      const [metaRows, accounts, employees] = await Promise.all([
        base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId: auth.companyId, category: "companyMeta" }),
        base44.asServiceRole.entities.CompanyAccount.filter({ companyId: auth.companyId }),
        base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId, employeeId: auth.userId }),
      ]);
      const ownerId = metaRows[0]?.payload?.[0]?.ownerId;
      const employee = employees[0];
      const ownerEmail = String(accounts[0]?.ownerEmail || "").trim().toLowerCase();
      const employeeEmail = String(employee?.email || "").trim().toLowerCase();
      if (ownerId === auth.userId || (ownerEmail && ownerEmail === employeeEmail)) {
        auth.owner = true;
        auth.manager = true;
        auth.role = "owner";
      }
    }

    const stations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
    const centralWarehouse = stations.find((station) => station.isCentralWarehouse) || stations.find((station) => ["central_warehouse", "warehouse"].includes(String(station.type || "").toLowerCase())) || stations[0] || null;
    const centralWarehouseId = centralWarehouse?.stationId || null;
    const warehouseAccess = auth.owner || auth.role === "warehouse_manager";
    const allStationIds = stations.map((station) => station.stationId);
    const visibleIds = seniorRoles.includes(auth.role) ? allStationIds : auth.role === "pgm" ? auth.managedStations : auth.role === "station_manager" ? [auth.stationId, ...auth.managedStations].filter(Boolean) : [auth.stationId].filter(Boolean);
    const visible = new Set(visibleIds);
    const ensureStation = (id) => allStationIds.includes(id) && (seniorRoles.includes(auth.role) || visible.has(id));
    const warehouseGuard = () => warehouseAccess ? null : Response.json({ error: "Central warehouse permission required" }, { status: 403 });
    const getItem = async (id) => (await base44.asServiceRole.entities.InventoryItem.filter({ id, companyId: auth.companyId }))[0];
    const balances = (item) => Array.isArray(item.locationBalances) ? item.locationBalances.map((entry) => ({ locationId: entry.locationId, quantity: Number(entry.quantity) || 0 })) : [];
    const balanceAt = (item, stationId) => balances(item).find((entry) => entry.locationId === stationId)?.quantity || 0;
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
      const scopedItems = items.filter((item) => warehouseAccess || visible.has(item.currentLocationId) || balances(item).some((entry) => visible.has(entry.locationId)));
      const scopedRequests = requests.filter((request) => warehouseAccess || visible.has(request.stationId) || request.requesterId === auth.userId);
      const scopedMovements = movements.filter((entry) => warehouseAccess || visible.has(entry.fromLocationId) || visible.has(entry.toLocationId));
      return Response.json({ items: scopedItems, requestItems: items, movements: scopedMovements, requests: scopedRequests, stations: stations.filter((station) => warehouseAccess || visible.has(station.stationId)), transferStations: warehouseAccess ? stations : [], employees, canManage: warehouseAccess, canWarehouseManage: warehouseAccess, canSetCentralWarehouse: auth.owner || auth.role === "director", centralWarehouseId });
    }

    if (body.action === "setCentralWarehouse") {
      if ((!auth.owner && auth.role !== "director") || !allStationIds.includes(body.stationId)) return Response.json({ error: "Company owner or director permission required" }, { status: 403 });
      await base44.asServiceRole.entities.Station.bulkUpdate(stations.map((station) => ({ id: station.id, isCentralWarehouse: station.stationId === body.stationId })));
      return Response.json({ ok: true });
    }

    if (body.action === "deleteItem") {
      const denied = warehouseGuard(); if (denied) return denied;
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
      const denied = warehouseGuard(); if (denied) return denied;
      const name = String(body.name || "").trim(); const itemCode = String(body.itemCode || "").trim();
      const minimum = Number(body.minimumStock || 0); const locationId = body.locationId;
      if (!name || !itemCode || !ensureStation(locationId) || minimum < 0) return Response.json({ error: "Invalid item data" }, { status: 400 });
      const duplicate = await base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId, itemCode });
      if (duplicate.length) return Response.json({ error: "Item code already exists" }, { status: 409 });
      const qrCode = `PC-ITEM:${auth.companyId}:${itemCode}`;
      const initialQty = Math.max(0, Number(body.quantity || 0));
      const created = await base44.asServiceRole.entities.InventoryItem.create({ companyId: auth.companyId, itemCode, name, currentLocationId: locationId, minimumStock: minimum, quantity: initialQty, locationBalances: [{ locationId, quantity: initialQty }], qrCode });
      if (initialQty > 0) await movement({ itemId: created.id, movementType: "receive", quantity: initialQty, fromLocationId: null, toLocationId: locationId, employeeId: null, requestId: null, balanceBefore: 0, balanceAfter: initialQty, sourceBalanceBefore: null, sourceBalanceAfter: null, destinationBalanceBefore: 0, destinationBalanceAfter: initialQty });
      return Response.json({ ok: true });
    }

    if (body.action === "request") {
      const item = await getItem(body.itemId); const quantity = Number(body.quantity); const notes = String(body.notes || "").trim();
      const stationId = auth.stationId || body.stationId;
      if (!item || !stationId || !allStationIds.includes(stationId) || quantity < 1 || !notes) return Response.json({ error: "Item, quantity and request reason are required" }, { status: 400 });
      await base44.asServiceRole.entities.MaterialRequest.create({ companyId: auth.companyId, requesterId: auth.userId, stationId, itemId: item.id, quantity, notes, status: "pending", supervisorId: null, reviewedBy: null, reviewedAt: null, issuedAt: null });
      return Response.json({ ok: true });
    }

    if (body.action === "reviewRequest") {
      const denied = warehouseGuard(); if (denied) return denied;
      const rows = await base44.asServiceRole.entities.MaterialRequest.filter({ id: body.requestId, companyId: auth.companyId }); const request = rows[0];
      if (!request || request.status !== "pending" || !allStationIds.includes(request.stationId) || !["approved", "rejected"].includes(body.decision)) return Response.json({ error: "Request cannot be reviewed" }, { status: 400 });
      await base44.asServiceRole.entities.MaterialRequest.update(request.id, { status: body.decision, reviewedBy: auth.userId || auth.name, reviewedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (body.action === "issueRequest") {
      const denied = warehouseGuard(); if (denied) return denied;
      if (!body.requestId || !centralWarehouseId) return Response.json({ error: "لا يمكن الصرف: لا يوجد طلب معتمد أو مستودع مركزي" }, { status: 400 });
      const requests = await base44.asServiceRole.entities.MaterialRequest.filter({ id: body.requestId, companyId: auth.companyId });
      const request = requests[0];
      if (!request || request.status !== "approved" || !allStationIds.includes(request.stationId)) return Response.json({ error: "لا يمكن الصرف: لا يوجد طلب معتمد" }, { status: 400 });
      const previousIssues = await base44.asServiceRole.entities.StockMovement.filter({ companyId: auth.companyId, requestId: request.id, movementType: "issue" });
      if (previousIssues.length) return Response.json({ error: "لا يمكن الصرف: تم صرف هذا الطلب مسبقاً" }, { status: 409 });
      const item = await getItem(request.itemId); if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      if (String(body.qrCode || "").trim() !== item.qrCode) return Response.json({ error: "Scanned code does not match the requested item" }, { status: 400 });
      const quantity = Number(request.quantity);
      const sourceBefore = balanceAt(item, centralWarehouseId);
      const destinationBefore = balanceAt(item, request.stationId);
      if (sourceBefore < quantity) return Response.json({ error: "لا يمكن الصرف: الكمية المطلوبة تتجاوز رصيد المستودع المركزي" }, { status: 400 });
      let next = adjustBalance(item, centralWarehouseId, -quantity);
      next = adjustBalance({ ...item, locationBalances: next }, request.stationId, quantity);
      await base44.asServiceRole.entities.InventoryItem.update(item.id, { locationBalances: next, currentLocationId: request.stationId });
      await movement({ itemId: item.id, movementType: "issue", quantity, fromLocationId: centralWarehouseId, toLocationId: request.stationId, employeeId: request.requesterId, requestId: request.id, balanceBefore: sourceBefore, balanceAfter: sourceBefore - quantity, sourceBalanceBefore: sourceBefore, sourceBalanceAfter: sourceBefore - quantity, destinationBalanceBefore: destinationBefore, destinationBalanceAfter: destinationBefore + quantity });
      await base44.asServiceRole.entities.MaterialRequest.update(request.id, { status: "issued", issuedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (["receive", "return", "transfer"].includes(body.action)) {
      const denied = warehouseGuard(); if (denied) return denied;
      const item = await getItem(body.itemId); if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      const quantity = Number(body.quantity || 1);
      if (!Number.isFinite(quantity) || quantity <= 0) return Response.json({ error: "Quantity must be greater than zero" }, { status: 400 });
      if (body.action === "receive") {
        if (!allStationIds.includes(body.toLocationId)) return Response.json({ error: "Invalid destination" }, { status: 400 });
        const before = balanceAt(item, body.toLocationId);
        const next = adjustBalance(item, body.toLocationId, quantity);
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: Number(item.quantity || 0) + quantity, locationBalances: next, currentLocationId: body.toLocationId });
        await movement({ itemId: item.id, movementType: "receive", quantity, fromLocationId: null, toLocationId: body.toLocationId, employeeId: null, requestId: null, balanceBefore: before, balanceAfter: before + quantity, sourceBalanceBefore: null, sourceBalanceAfter: null, destinationBalanceBefore: before, destinationBalanceAfter: before + quantity });
      }
      if (body.action === "return") {
        const fromId = body.fromLocationId; const toId = centralWarehouseId;
        if (!fromId || !toId || fromId === toId || !allStationIds.includes(fromId)) return Response.json({ error: "Invalid return" }, { status: 400 });
        if (String(body.qrCode || "").trim() !== item.qrCode) return Response.json({ error: "QR mismatch" }, { status: 400 });
        const sourceBefore = balanceAt(item, fromId); const destinationBefore = balanceAt(item, toId);
        let next = adjustBalance(item, fromId, -quantity);
        next = adjustBalance({ ...item, locationBalances: next }, toId, quantity);
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { locationBalances: next, currentLocationId: toId });
        await movement({ itemId: item.id, movementType: "return", quantity, fromLocationId: fromId, toLocationId: toId, employeeId: body.employeeId || null, requestId: null, balanceBefore: sourceBefore, balanceAfter: sourceBefore - quantity, sourceBalanceBefore: sourceBefore, sourceBalanceAfter: sourceBefore - quantity, destinationBalanceBefore: destinationBefore, destinationBalanceAfter: destinationBefore + quantity });
      }
      if (body.action === "transfer") {
        if (body.fromLocationId === body.toLocationId) return Response.json({ error: "لا يمكن النقل إلى المحطة نفسها" }, { status: 400 });
        if (!allStationIds.includes(body.fromLocationId) || !allStationIds.includes(body.toLocationId)) return Response.json({ error: "Invalid transfer" }, { status: 400 });
        const sourceBefore = balanceAt(item, body.fromLocationId); const destinationBefore = balanceAt(item, body.toLocationId);
        let next = adjustBalance(item, body.fromLocationId, -quantity);
        next = adjustBalance({ ...item, locationBalances: next }, body.toLocationId, quantity);
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { locationBalances: next, currentLocationId: body.toLocationId });
        await movement({ itemId: item.id, movementType: "transfer", quantity, fromLocationId: body.fromLocationId, toLocationId: body.toLocationId, employeeId: null, requestId: null, balanceBefore: sourceBefore, balanceAfter: sourceBefore - quantity, sourceBalanceBefore: sourceBefore, sourceBalanceAfter: sourceBefore - quantity, destinationBalanceBefore: destinationBefore, destinationBalanceAfter: destinationBefore + quantity });
      }
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Inventory error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});