import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

const stationRoles = ["station_manager", "inventory_keeper"];
const seniorRoles = ["owner", "director", "ops_manager"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const platformUser = await base44.auth.me().catch(() => null);
    let auth = null;
    if (body.sessionToken && body.companyId) {
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: body.sessionToken, companyId: body.companyId });
      const session = sessions[0];
      if (session && new Date(session.expiresAt).getTime() > Date.now()) {
        if (session.role === "owner") auth = { companyId: body.companyId, userId: session.userId || null, role: "owner", name: "Owner", manager: true, owner: true, stationId: null, managedStations: [] };
        else {
          const employees = await base44.asServiceRole.entities.Employee.filter({ companyId: body.companyId, employeeId: session.userId });
          const employee = employees[0];
          if (employee) auth = { companyId: body.companyId, userId: employee.employeeId, role: employee.role, name: employee.name, manager: stationRoles.includes(employee.role), owner: false, stationId: employee.stationId || null, managedStations: employee.managedStations || [] };
        }
      }
    }
    if (!auth && platformUser?.role === "admin" && body.companyId) auth = { companyId: body.companyId, userId: body.userId || null, role: "owner", name: platformUser.full_name || "Admin", manager: true, owner: true, stationId: null, managedStations: [] };
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

    let stations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
    // The owner-controlled local directory is used only to repair missing persisted
    // station rows. This keeps every module on the same canonical station roster.
    if (auth.owner && Array.isArray(body.stations) && body.stations.length) {
      const existingIds = new Set(stations.map((station) => station.stationId));
      const missing = body.stations
        .filter((station) => station?.id && !existingIds.has(station.id))
        .map((station) => ({
          stationId: station.id,
          companyId: auth.companyId,
          name: String(station.name || "Station"),
          location: String(station.location || ""),
          type: String(station.type || ""),
          status: String(station.status || "active"),
          managerId: station.managerId || null,
          lat: station.lat != null && station.lat !== "" && Number.isFinite(Number(station.lat)) ? Number(station.lat) : null,
          lng: station.lng != null && station.lng !== "" && Number.isFinite(Number(station.lng)) ? Number(station.lng) : null,
          radiusMeters: station.radiusMeters != null && station.radiusMeters !== "" && Number.isFinite(Number(station.radiusMeters)) ? Number(station.radiusMeters) : null,
          isCentralWarehouse: station.isCentralWarehouse === true,
        }));
      if (missing.length) {
        await base44.asServiceRole.entities.Station.bulkCreate(missing);
        stations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
      }
    }
    const isSenior = seniorRoles.includes(auth.role);
    const isStationOperator = stationRoles.includes(auth.role) && !!auth.stationId;
    const canPurchase = isStationOperator;
    const canCreateItem = isStationOperator;
    const canApproveProcurement = false;
    const canReceiveProcurement = isStationOperator;
    const allStationIds = stations.map((station) => station.stationId);
    const visibleIds = isSenior ? allStationIds : isStationOperator ? [auth.stationId] : [];
    const visible = new Set(visibleIds);
    const ensureStation = (id) => isStationOperator && id === auth.stationId && allStationIds.includes(id);
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
      const [items, movements, requests, employees, procurementRequests, purchaseOrders] = await Promise.all([
        base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId }, "-updated_date", 500),
        base44.asServiceRole.entities.StockMovement.filter({ companyId: auth.companyId }, "-created_date", 300),
        base44.asServiceRole.entities.MaterialRequest.filter({ companyId: auth.companyId }, "-created_date", 300),
        base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId }),
        base44.asServiceRole.entities.ProcurementRequest.filter({ companyId: auth.companyId }, "-created_date", 300),
        base44.asServiceRole.entities.PurchaseOrder.filter({ companyId: auth.companyId }, "-created_date", 300),
      ]);
      const scopedItems = items.filter((item) => isSenior || balances(item).some((entry) => visible.has(entry.locationId)));
      const scopedRequests = requests.filter((request) => isSenior || visible.has(request.stationId) || visible.has(request.sourceStationId));
      const scopedMovements = movements.filter((entry) => isSenior || visible.has(entry.fromLocationId) || visible.has(entry.toLocationId));
      const scopedStations = stations.filter((station) => isSenior || visible.has(station.stationId));
      const purchases = scopedMovements.filter((entry) => entry.movementType === "purchase");
      const scopedProcurementRequests = procurementRequests.filter((entry) => isSenior || visible.has(entry.stationId));
      const scopedPurchaseOrders = purchaseOrders.filter((entry) => isSenior || visible.has(entry.stationId));
      return Response.json({ items: scopedItems, requestItems: isSenior ? items : items.map((item) => ({ id: item.id, itemCode: item.itemCode, name: item.name, minimumStock: item.minimumStock, locationBalances: balances(item) })), movements: scopedMovements, purchases, procurementRequests: scopedProcurementRequests, purchaseOrders: scopedPurchaseOrders, requests: scopedRequests, stations: scopedStations, locations: scopedStations, transferStations: stations, employees, canManage: isStationOperator, canPurchase, canCreateItem, canIssueToWork: isStationOperator, canDelete: isStationOperator, canApproveProcurement, canReceiveProcurement, canViewAllPurchases: isSenior, canWarehouseManage: false, canTransfer: isStationOperator, canSetCentralWarehouse: false, centralWarehouseId: null, isCentralView: isSenior, budgetThreshold: 50000 });
    }

    if (body.action === "submitProcurement") {
      const stationId = String(body.stationId || auth.stationId || "");
      const items = Array.isArray(body.items) ? body.items.map((item) => ({ itemCode: String(item.itemCode || "").trim(), name: String(item.name || "").trim(), quantity: Number(item.quantity), estimatedUnitCost: Number(item.estimatedUnitCost || 0) })) : [];
      if (!ensureStation(stationId) || !String(body.justification || "").trim() || !items.length || items.some((item) => !item.itemCode || !item.name || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.estimatedUnitCost) || item.estimatedUnitCost < 0)) return Response.json({ error: "Valid station, items and justification are required" }, { status: 400 });
      await base44.asServiceRole.entities.ProcurementRequest.create({ companyId: auth.companyId, requestNumber: `PR-${Date.now().toString(36).toUpperCase()}`, stationId, requesterId: auth.userId, requesterName: auth.name, items, justification: String(body.justification).trim(), status: "pending", reviewedBy: null, reviewedAt: null });
      return Response.json({ ok: true });
    }

    if (body.action === "reviewProcurement") {
      if (!canApproveProcurement) return Response.json({ error: "Procurement approval permission required" }, { status: 403 });
      const rows = await base44.asServiceRole.entities.ProcurementRequest.filter({ id: body.requestId, companyId: auth.companyId }); const request = rows[0];
      if (!request || request.status !== "pending" || !["approved", "rejected"].includes(body.decision)) return Response.json({ error: "Request cannot be reviewed" }, { status: 400 });
      await base44.asServiceRole.entities.ProcurementRequest.update(request.id, { status: body.decision, reviewedBy: auth.userId || auth.name, reviewedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (body.action === "createPurchaseOrder") {
      if (!canApproveProcurement) return Response.json({ error: "Purchase order permission required" }, { status: 403 });
      const rows = await base44.asServiceRole.entities.ProcurementRequest.filter({ id: body.requestId, companyId: auth.companyId }); const request = rows[0];
      const supplierName = String(body.supplierName || "").trim();
      const items = Array.isArray(body.items) ? body.items.map((item) => ({ itemCode: String(item.itemCode || "").trim(), name: String(item.name || "").trim(), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })) : [];
      if (!request || request.status !== "approved" || !supplierName || items.length !== request.items.length || items.some((item) => !item.itemCode || !item.name || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) return Response.json({ error: "Approved request, supplier and valid prices are required" }, { status: 400 });
      const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      await base44.asServiceRole.entities.PurchaseOrder.create({ companyId: auth.companyId, orderNumber: `PO-${Date.now().toString(36).toUpperCase()}`, requestId: request.id, stationId: request.stationId, supplierName, items, totalCost, status: "issued", issuedBy: auth.userId || auth.name, issuedAt: new Date().toISOString(), receivedBy: null, receivedAt: null });
      await base44.asServiceRole.entities.ProcurementRequest.update(request.id, { status: "ordered" });
      return Response.json({ ok: true });
    }

    if (body.action === "receivePurchaseOrder") {
      if (!canReceiveProcurement) return Response.json({ error: "Receiving permission required" }, { status: 403 });
      const rows = await base44.asServiceRole.entities.PurchaseOrder.filter({ id: body.orderId, companyId: auth.companyId }); const order = rows[0];
      if (!order || order.status !== "issued" || !ensureStation(order.stationId)) return Response.json({ error: "Purchase order cannot be received" }, { status: 400 });
      for (const line of order.items) {
        const duplicates = await base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId, itemCode: line.itemCode });
        let item = duplicates[0]; const quantity = Number(line.quantity); const before = item ? balanceAt(item, order.stationId) : 0;
        if (item) { const next = adjustBalance(item, order.stationId, quantity); await base44.asServiceRole.entities.InventoryItem.update(item.id, { name: line.name, quantity: Number(item.quantity || 0) + quantity, locationBalances: next, currentLocationId: order.stationId }); }
        else item = await base44.asServiceRole.entities.InventoryItem.create({ companyId: auth.companyId, itemCode: line.itemCode, name: line.name, currentLocationId: order.stationId, minimumStock: 0, quantity, locationBalances: [{ locationId: order.stationId, quantity }], qrCode: `PC-ITEM:${auth.companyId}:${line.itemCode}` });
        await movement({ itemId: item.id, movementType: "purchase", quantity, fromLocationId: null, toLocationId: order.stationId, employeeId: auth.userId, requestId: order.requestId, balanceBefore: before, balanceAfter: before + quantity, sourceBalanceBefore: null, sourceBalanceAfter: null, destinationBalanceBefore: before, destinationBalanceAfter: before + quantity, purchasePrice: Number(line.unitPrice), unitPrice: Number(line.unitPrice), totalCost: quantity * Number(line.unitPrice), supplierName: order.supplierName, purchaseDate: new Date().toISOString(), notes: order.orderNumber });
      }
      await base44.asServiceRole.entities.PurchaseOrder.update(order.id, { status: "received", receivedBy: auth.userId || auth.name, receivedAt: new Date().toISOString() });
      await base44.asServiceRole.entities.ProcurementRequest.update(order.requestId, { status: "received" });
      return Response.json({ ok: true });
    }

    if (body.action === "issueToWork") {
      if (!isStationOperator) return Response.json({ error: "Station inventory permission required" }, { status: 403 });
      const itemId = String(body.itemId || ""); const stationId = String(body.fromLocationId || auth.stationId || "");
      const quantity = Number(body.quantity); const employeeId = String(body.employeeId || "");
      const workReference = String(body.workReference || "").trim(); const workDate = String(body.workDate || ""); const notes = String(body.notes || "").trim();
      if (!itemId || !ensureStation(stationId) || !employeeId || !workReference || !/^\d{4}-\d{2}-\d{2}$/.test(workDate) || !Number.isFinite(quantity) || quantity <= 0) return Response.json({ error: "Valid item, station, quantity, recipient and work reference are required" }, { status: 400 });
      const [item, employeeRows] = await Promise.all([getItem(itemId), base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId, employeeId })]);
      if (!item || !employeeRows[0]) return Response.json({ error: "Item or recipient not found" }, { status: 404 });
      const before = balanceAt(item, stationId);
      if (before < quantity) return Response.json({ error: "Insufficient station stock" }, { status: 400 });
      const next = adjustBalance(item, stationId, -quantity);
      await base44.asServiceRole.entities.InventoryItem.update(item.id, { quantity: Math.max(0, Number(item.quantity || 0) - quantity), locationBalances: next, currentLocationId: stationId });
      await movement({ itemId: item.id, movementType: "issue", quantity, fromLocationId: stationId, toLocationId: null, employeeId, requestId: null, balanceBefore: before, balanceAfter: before - quantity, sourceBalanceBefore: before, sourceBalanceAfter: before - quantity, destinationBalanceBefore: null, destinationBalanceAfter: null, workReference, workDate, notes });
      return Response.json({ ok: true });
    }

    if (body.action === "deleteItem") {
      if (!isStationOperator) return Response.json({ error: "Station inventory permission required" }, { status: 403 });
      const item = await getItem(body.itemId);
      if (!item || !balances(item).some((entry) => entry.locationId === auth.stationId)) return Response.json({ error: "Item not found in your station" }, { status: 404 });
      const remaining = balances(item).filter((entry) => entry.locationId !== auth.stationId);
      if (remaining.some((entry) => entry.quantity > 0)) await base44.asServiceRole.entities.InventoryItem.update(item.id, { locationBalances: remaining, quantity: remaining.reduce((sum, entry) => sum + entry.quantity, 0), currentLocationId: remaining.find((entry) => entry.quantity > 0)?.locationId || remaining[0]?.locationId || auth.stationId });
      else await base44.asServiceRole.entities.InventoryItem.delete(item.id);
      return Response.json({ ok: true });
    }

    if (body.action === "createItem") {
      if (!canCreateItem) return Response.json({ error: "Station inventory permission required" }, { status: 403 });
      const name = String(body.name || "").trim(); const itemCode = String(body.itemCode || "").trim();
      const supplierName = String(body.supplierName || "").trim(); const locationId = String(body.locationId || auth.stationId || "");
      const quantity = Number(body.quantity); const totalCost = Number(body.totalCost); const enteredUnitPrice = body.unitPrice === "" || body.unitPrice == null ? null : Number(body.unitPrice);
      const unitPrice = enteredUnitPrice == null ? totalCost / quantity : enteredUnitPrice;
      const selectedDate = String(body.purchaseDate || "");
      const purchaseMoment = selectedDate.length === 10 ? new Date(`${selectedDate}T${new Date().toTimeString().slice(0, 8)}`) : new Date(selectedDate || Date.now());
      const purchaseDate = purchaseMoment.toISOString();
      if (!name || !itemCode || !supplierName || !ensureStation(locationId) || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(totalCost) || totalCost < 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return Response.json({ error: "Valid item, station, quantity, supplier and cost are required" }, { status: 400 });
      const duplicates = await base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId, itemCode });
      let item = duplicates[0]; let before = 0;
      if (item) {
        before = balanceAt(item, locationId);
        const next = adjustBalance(item, locationId, quantity);
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { name, quantity: Number(item.quantity || 0) + quantity, locationBalances: next, currentLocationId: locationId });
      } else {
        const qrCode = `PC-ITEM:${auth.companyId}:${itemCode}`;
        item = await base44.asServiceRole.entities.InventoryItem.create({ companyId: auth.companyId, itemCode, name, currentLocationId: locationId, minimumStock: Math.max(0, Number(body.minimumStock || 0)), quantity, locationBalances: [{ locationId, quantity }], qrCode });
      }
      await movement({ itemId: item.id, movementType: "purchase", quantity, fromLocationId: null, toLocationId: locationId, employeeId: auth.userId, requestId: null, balanceBefore: before, balanceAfter: before + quantity, sourceBalanceBefore: null, sourceBalanceAfter: null, destinationBalanceBefore: before, destinationBalanceAfter: before + quantity, purchasePrice: unitPrice, unitPrice, totalCost, supplierName, purchaseDate });
      return Response.json({ ok: true });
    }

    if (body.action === "request") {
      if (!isStationOperator) return Response.json({ error: "Station inventory permission required" }, { status: 403 });
      const item = await getItem(body.itemId); const quantity = Number(body.quantity); const notes = String(body.notes || "").trim();
      const stationId = String(body.stationId || auth.stationId || ""); const sourceStationId = String(body.sourceStationId || "");
      if (!item || !ensureStation(stationId) || !allStationIds.includes(sourceStationId) || sourceStationId === stationId || balanceAt(item, sourceStationId) < quantity || quantity < 1 || !notes) return Response.json({ error: "Choose an available item from another station and enter a valid quantity and reason" }, { status: 400 });
      await base44.asServiceRole.entities.MaterialRequest.create({ companyId: auth.companyId, requesterId: auth.userId || auth.name, stationId, sourceStationId, itemId: item.id, quantity, notes, status: "pending", supervisorId: null, reviewedBy: null, reviewedAt: null, issuedAt: null });
      return Response.json({ ok: true });
    }

    if (body.action === "reviewRequest") {
      if (!isStationOperator) return Response.json({ error: "Station inventory permission required" }, { status: 403 });
      const rows = await base44.asServiceRole.entities.MaterialRequest.filter({ id: body.requestId, companyId: auth.companyId }); const request = rows[0];
      if (!request || request.status !== "pending" || request.sourceStationId !== auth.stationId || !["approved", "rejected"].includes(body.decision)) return Response.json({ error: "Request cannot be reviewed by this station" }, { status: 400 });
      const reviewedAt = new Date().toISOString();
      if (body.decision === "rejected") { await base44.asServiceRole.entities.MaterialRequest.update(request.id, { status: "rejected", reviewedBy: auth.userId || auth.name, reviewedAt }); return Response.json({ ok: true }); }
      const item = await getItem(request.itemId); const quantity = Number(request.quantity);
      if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      const sourceBefore = balanceAt(item, request.sourceStationId); const destinationBefore = balanceAt(item, request.stationId);
      if (sourceBefore < quantity) return Response.json({ error: "Insufficient source station stock" }, { status: 400 });
      let next = adjustBalance(item, request.sourceStationId, -quantity); next = adjustBalance({ ...item, locationBalances: next }, request.stationId, quantity);
      await base44.asServiceRole.entities.InventoryItem.update(item.id, { locationBalances: next, currentLocationId: request.stationId });
      await movement({ itemId: item.id, movementType: "transfer", quantity, fromLocationId: request.sourceStationId, toLocationId: request.stationId, employeeId: request.requesterId, requestId: request.id, balanceBefore: sourceBefore, balanceAfter: sourceBefore - quantity, sourceBalanceBefore: sourceBefore, sourceBalanceAfter: sourceBefore - quantity, destinationBalanceBefore: destinationBefore, destinationBalanceAfter: destinationBefore + quantity });
      await base44.asServiceRole.entities.MaterialRequest.update(request.id, { status: "issued", reviewedBy: auth.userId || auth.name, reviewedAt, issuedAt: reviewedAt });
      return Response.json({ ok: true });
    }

    if (body.action === "issueRequest") return Response.json({ error: "Central warehouse issuing is no longer available" }, { status: 410 });

    if (["receive", "return", "transfer"].includes(body.action)) return Response.json({ error: "Use station purchases or transfer requests" }, { status: 410 });
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Inventory error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});