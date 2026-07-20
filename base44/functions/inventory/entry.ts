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
    const centralWarehouseId = "central_warehouse";
    const warehouseAccess = auth.owner || ["director", "warehouse_manager"].includes(auth.role);
    const canPurchase = auth.owner || managerRoles.includes(auth.role);
    const canCreateItem = stations.length > 0;
    const canApproveProcurement = auth.owner || ["director", "ops_manager"].includes(auth.role);
    const canReceiveProcurement = auth.owner || managerRoles.includes(auth.role);
    const allStationIds = stations.map((station) => station.stationId);
    const allLocationIds = [...allStationIds];
    const visibleIds = seniorRoles.includes(auth.role) ? allStationIds : auth.role === "pgm" ? auth.managedStations : auth.role === "station_manager" ? [auth.stationId, ...auth.managedStations].filter(Boolean) : [auth.stationId].filter(Boolean);
    const visible = new Set(visibleIds);
    const ensureStation = (id) => allStationIds.includes(id) && (seniorRoles.includes(auth.role) || visible.has(id));
    const warehouseGuard = () => warehouseAccess ? null : Response.json({ error: "Inventory management permission required" }, { status: 403 });
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
      const scopedItems = items.filter((item) => warehouseAccess || visible.has(item.currentLocationId) || balances(item).some((entry) => visible.has(entry.locationId)));
      const scopedRequests = requests.filter((request) => warehouseAccess || visible.has(request.stationId) || request.requesterId === auth.userId);
      const scopedMovements = movements.filter((entry) => seniorRoles.includes(auth.role) || visible.has(entry.fromLocationId) || visible.has(entry.toLocationId));
      const scopedStations = stations.filter((station) => seniorRoles.includes(auth.role) || visible.has(station.stationId));
      const purchases = scopedMovements.filter((entry) => entry.movementType === "purchase" || (entry.movementType === "receive" && entry.supplierName));
      const scopedProcurementRequests = procurementRequests.filter((entry) => seniorRoles.includes(auth.role) || visible.has(entry.stationId) || entry.requesterId === auth.userId);
      const scopedPurchaseOrders = purchaseOrders.filter((entry) => seniorRoles.includes(auth.role) || visible.has(entry.stationId));
      const locations = scopedStations;
      const transferStations = auth.manager ? stations : [];
      return Response.json({ items: scopedItems, requestItems: items, movements: scopedMovements, purchases, procurementRequests: scopedProcurementRequests, purchaseOrders: scopedPurchaseOrders, requests: scopedRequests, stations: scopedStations, locations, transferStations, requestStations: stations, employees, canManage: canPurchase, canPurchase, canCreateItem, canIssueToWork: canPurchase, canDelete: warehouseAccess, canApproveProcurement, canReceiveProcurement, canViewAllPurchases: seniorRoles.includes(auth.role), canWarehouseManage: false, canTransfer: auth.manager, canSetCentralWarehouse: false, centralWarehouseId: null });
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
      if (!canPurchase) return Response.json({ error: "Work issue permission required" }, { status: 403 });
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

    if (body.action === "createCatalogItem") {
      if (!canCreateItem) return Response.json({ error: "A station is required to create an item" }, { status: 403 });
      const name = String(body.name || "").trim(); const itemCode = String(body.itemCode || "").trim();
      const locationId = String(body.locationId || auth.stationId || ""); const minimumStock = Math.max(0, Number(body.minimumStock || 0));
      if (!name || !itemCode || !ensureStation(locationId)) return Response.json({ error: "Valid item name, code and station are required" }, { status: 400 });
      const duplicates = await base44.asServiceRole.entities.InventoryItem.filter({ companyId: auth.companyId, itemCode });
      if (duplicates.length) return Response.json({ error: "An item with this code already exists" }, { status: 409 });
      await base44.asServiceRole.entities.InventoryItem.create({ companyId: auth.companyId, itemCode, name, currentLocationId: locationId, minimumStock, quantity: 0, locationBalances: [{ locationId, quantity: 0 }], qrCode: `PC-ITEM:${auth.companyId}:${itemCode}` });
      return Response.json({ ok: true });
    }

    if (body.action === "createItem") {
      if (!canCreateItem) return Response.json({ error: "A station is required to create an item" }, { status: 403 });
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
      const item = await getItem(body.itemId); const quantity = Number(body.quantity); const notes = String(body.notes || "").trim();
      const stationId = String(body.stationId || auth.stationId || ""); const sourceStationId = String(body.sourceStationId || "");
      if (!item || !ensureStation(stationId) || !allStationIds.includes(sourceStationId) || sourceStationId === stationId || balanceAt(item, sourceStationId) < quantity || quantity < 1 || !notes) return Response.json({ error: "Choose an available item from another station and enter a valid quantity and reason" }, { status: 400 });
      await base44.asServiceRole.entities.MaterialRequest.create({ companyId: auth.companyId, requesterId: auth.userId || auth.name, stationId, sourceStationId, itemId: item.id, quantity, notes, status: "pending", supervisorId: null, reviewedBy: null, reviewedAt: null, issuedAt: null });
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
      if (body.action === "transfer" && !auth.manager) return Response.json({ error: "Station transfer permission required" }, { status: 403 });
      if (body.action !== "transfer") { const denied = warehouseGuard(); if (denied) return denied; }
      const item = await getItem(body.itemId); if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      const quantity = Number(body.quantity || 1);
      if (!Number.isFinite(quantity) || quantity <= 0) return Response.json({ error: "Quantity must be greater than zero" }, { status: 400 });
      if (body.action === "receive") {
        if (!allLocationIds.includes(body.toLocationId)) return Response.json({ error: "Invalid destination" }, { status: 400 });
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
        if (body.fromLocationId === body.toLocationId) return Response.json({ error: "لا يمكن النقل إلى الموقع نفسه" }, { status: 400 });
        if (!allLocationIds.includes(body.fromLocationId) || !allLocationIds.includes(body.toLocationId)) return Response.json({ error: "Invalid transfer" }, { status: 400 });
        if (!seniorRoles.includes(auth.role) && !visible.has(body.fromLocationId)) return Response.json({ error: "Station transfer permission required" }, { status: 403 });
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