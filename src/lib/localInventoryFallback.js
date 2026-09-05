/**
 * Inventory + stock board when the `inventory` / `stock` cloud functions are down.
 * Same list/mutation shape the pages already consume.
 */
import { getCompanyData, getSession, updateCompany } from "@/lib/store";
import {
  applyPoToItems,
  checkRaisePoGate,
  deriveStockAlert,
  enrichStockItem,
} from "@/lib/inventoryDerivations";

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const forcedLocalCompanies = new Set();

function notifyInventoryChanged(companyId) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("powercare:inventory-changed", { detail: { companyId } }));
  }
}

export function forceLocalInventory(companyId) {
  if (companyId) forcedLocalCompanies.add(companyId);
  notifyInventoryChanged(companyId);
}

export function isForcedLocalInventory(companyId) {
  return !!companyId && forcedLocalCompanies.has(companyId);
}

function actor(companyId, session) {
  const live = session || getSession();
  const data = getCompanyData(companyId);
  const user = (data?.employees || []).find((e) => e.id === live?.userId);
  const owner = !user || user.role === "owner" || user.id === data?.ownerId || user.role === "director";
  const role = owner && user?.role !== "director" ? "owner" : (user?.role || "owner");
  return {
    companyId,
    userId: user?.id || live?.userId || "owner",
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

function balancesOf(item) {
  if (Array.isArray(item.locationBalances) && item.locationBalances.length) {
    return item.locationBalances.map((entry) => ({
      locationId: entry.locationId,
      quantity: Number(entry.quantity) || 0,
    }));
  }
  const locationId = item.currentLocationId || item.stationId;
  const quantity = Number(item.quantity ?? item.qty) || 0;
  return locationId ? [{ locationId, quantity }] : [];
}

function balanceAt(item, stationId) {
  return balancesOf(item).find((entry) => entry.locationId === stationId)?.quantity || 0;
}

function adjustBalance(item, stationId, delta) {
  const next = balancesOf(item);
  const index = next.findIndex((entry) => entry.locationId === stationId);
  if (index < 0) next.push({ locationId: stationId, quantity: Math.max(0, delta) });
  else next[index] = { ...next[index], quantity: Math.max(0, next[index].quantity + delta) };
  return next;
}

function normalizeItem(raw, stations) {
  const fallbackStation = raw.currentLocationId || raw.stationId || stations[0]?.stationId || stations[0]?.id;
  const quantity = Number(raw.quantity ?? raw.qty) || 0;
  const locationBalances = balancesOf({ ...raw, currentLocationId: fallbackStation, quantity });
  return {
    ...raw,
    id: raw.id || uid("ivi"),
    itemCode: String(raw.itemCode || raw.sku || raw.id || uid("sku")).trim(),
    name: String(raw.name || "").trim() || "صنف",
    quantity: locationBalances.reduce((sum, entry) => sum + entry.quantity, 0),
    minimumStock: Math.max(0, Number(raw.minimumStock ?? raw.minQty) || 0),
    leadDays: Math.max(0, Number(raw.leadDays) || 7),
    currentLocationId: fallbackStation,
    locationBalances,
    archived: raw.archived === true,
  };
}

function ensureLedger(data) {
  const stations = stationRows(data);
  const fromLegacy = [
    ...(Array.isArray(data.inventoryItems) ? data.inventoryItems : []),
    ...(Array.isArray(data.inventory) ? data.inventory : []),
  ];
  const byCode = new Map();
  fromLegacy.forEach((raw) => {
    if (!raw || typeof raw !== "object") return;
    const item = normalizeItem(raw, stations);
    const prev = byCode.get(item.itemCode);
    if (!prev) {
      byCode.set(item.itemCode, item);
      return;
    }
    item.locationBalances.forEach((entry) => {
      prev.locationBalances = adjustBalance(prev, entry.locationId, entry.quantity);
    });
    prev.quantity = prev.locationBalances.reduce((sum, entry) => sum + entry.quantity, 0);
  });
  data.inventoryItems = [...byCode.values()];
  data.stockMovements = Array.isArray(data.stockMovements) ? data.stockMovements : [];
  data.materialRequests = Array.isArray(data.materialRequests) ? data.materialRequests : [];
  data.stockPurchaseOrders = Array.isArray(data.stockPurchaseOrders) ? data.stockPurchaseOrders : [];
  data.stockRaisedScopes = data.stockRaisedScopes && typeof data.stockRaisedScopes === "object" ? data.stockRaisedScopes : {};
  return data;
}

function caps(auth) {
  const senior = auth.owner || ["owner", "director", "ops_manager", "pgm", "admin"].includes(auth.role);
  const stationOp = ["station_manager", "inventory_keeper"].includes(auth.role);
  const employee = auth.role === "employee";
  return {
    senior,
    stationOp,
    employee,
    canPurchase: senior || stationOp,
    canCreateItem: senior || stationOp,
    canIssueToWork: senior || stationOp,
    canIssueFromAnyStation: senior,
    canRequest: senior || stationOp || employee,
    canReviewRequests: senior || stationOp,
    canReviewAllRequests: senior,
    canDelete: senior || auth.role === "station_manager",
    canReverse: senior,
    canViewNetwork: senior || stationOp,
  };
}

function nextMovementNumber(movements) {
  const year = new Intl.DateTimeFormat("en", { timeZone: "Asia/Riyadh", year: "numeric" }).format(new Date());
  const highest = movements.reduce((max, entry) => {
    const match = String(entry.movementNumber || "").match(new RegExp(`^MOV-${year}-(\\d{6})$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `MOV-${year}-${String(highest + 1).padStart(6, "0")}`;
}

function syncIncomingStations(companyId, incoming) {
  if (!Array.isArray(incoming) || !incoming.length) return;
  updateCompany(companyId, (data) => {
    if (!data) return;
    const have = new Set((data.stations || []).map((station) => station.id || station.stationId));
    const extra = incoming.filter((station) => {
      const id = station?.id || station?.stationId;
      return id && !have.has(id);
    });
    if (extra.length) data.stations = [...(data.stations || []), ...extra];
    ensureLedger(data);
  });
}

function listState(companyId, session) {
  const data = getCompanyData(companyId) || { stations: [], employees: [] };
  ensureLedger(data);
  const auth = actor(companyId, session);
  const rights = caps(auth);
  const stations = stationRows(data);
  const items = (data.inventoryItems || []).filter((item) => item.archived !== true);
  const movements = data.stockMovements || [];
  const requests = data.materialRequests || [];
  return {
    items,
    requestItems: items,
    historyItems: data.inventoryItems || [],
    movements,
    purchases: movements.filter((entry) => entry.movementType === "purchase"),
    procurementRequests: [],
    purchaseOrders: data.stockPurchaseOrders || [],
    requests,
    stations,
    locations: stations,
    transferStations: stations,
    employees: data.employees || [],
    canManage: rights.stationOp,
    canPurchase: rights.canPurchase,
    canCreateItem: rights.canCreateItem,
    canIssueToWork: rights.canIssueToWork,
    canIssueFromAnyStation: rights.canIssueFromAnyStation,
    canRequest: rights.canRequest,
    canReviewRequests: rights.canReviewRequests,
    canReviewAllRequests: rights.canReviewAllRequests,
    canDelete: rights.canDelete,
    canApproveProcurement: false,
    canReceiveProcurement: false,
    canViewAllPurchases: rights.canViewNetwork,
    canWarehouseManage: false,
    canTransfer: false,
    canSetCentralWarehouse: false,
    canReverse: rights.canReverse,
    centralWarehouseId: null,
  };
}

function fail(message, code) {
  const error = new Error(message);
  error.response = { data: { error: message, code } };
  throw error;
}

export function localInventoryCall(session, action, payload = {}) {
  const companyId = session?.companyId || getSession()?.companyId;
  if (!companyId) fail("Missing companyId");
  const auth = actor(companyId, session);
  const rights = caps(auth);

  if (action === "list") {
    try {
      syncIncomingStations(companyId, payload.stations);
      const current = getCompanyData(companyId);
      const first = current?.inventoryItems?.[0];
      const needsMigrate = (first && !Array.isArray(first.locationBalances)) || !Array.isArray(current?.stockMovements);
      if (needsMigrate) updateCompany(companyId, (data) => { if (data) ensureLedger(data); });
      return listState(companyId, session);
    } catch (error) {
      console.error("NiroVera local inventory list:", error);
      return listState(companyId, session);
    }
  }

  if (action === "createItem") {
    if (!rights.canCreateItem) fail("Station inventory permission required");
    const name = String(payload.name || "").trim();
    const itemCode = String(payload.itemCode || "").trim();
    const supplierName = String(payload.supplierName || "").trim();
    const locationId = String(payload.locationId || auth.stationId || "");
    const quantity = Number(payload.quantity);
    const totalCost = Number(payload.totalCost);
    const enteredUnitPrice = payload.unitPrice === "" || payload.unitPrice == null ? null : Number(payload.unitPrice);
    const unitPrice = enteredUnitPrice == null ? totalCost / quantity : enteredUnitPrice;
    if (!name || !itemCode || !supplierName || !locationId || !Number.isFinite(quantity) || quantity <= 0) {
      fail("Valid item, station, quantity, supplier and cost are required");
    }
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      let item = data.inventoryItems.find((entry) => entry.itemCode === itemCode && entry.archived !== true);
      let before = 0;
      if (item) {
        before = balanceAt(item, locationId);
        item.locationBalances = adjustBalance(item, locationId, quantity);
        item.quantity = item.locationBalances.reduce((sum, entry) => sum + entry.quantity, 0);
        item.name = name;
        item.currentLocationId = locationId;
        item.archived = false;
        if (Array.isArray(payload.imageUrls) && payload.imageUrls.length) {
          item.imageUrls = [...(item.imageUrls || []), ...payload.imageUrls].slice(-10);
        }
      } else {
        item = normalizeItem({
          id: uid("ivi"),
          itemCode,
          name,
          quantity,
          minimumStock: Math.max(0, Number(payload.minimumStock) || 0),
          currentLocationId: locationId,
          imageUrls: Array.isArray(payload.imageUrls) ? payload.imageUrls.slice(0, 10) : [],
          qrCode: `PC-ITEM:${companyId}:${itemCode}`,
        }, stationRows(data));
        data.inventoryItems.push(item);
      }
      data.stockMovements.unshift({
        id: uid("mov"),
        movementNumber: nextMovementNumber(data.stockMovements),
        itemId: item.id,
        movementType: "purchase",
        quantity,
        fromLocationId: null,
        toLocationId: locationId,
        employeeId: auth.userId,
        requestId: null,
        balanceBefore: before,
        balanceAfter: before + quantity,
        purchasePrice: unitPrice,
        unitPrice,
        totalCost,
        supplierName,
        purchaseDate: payload.purchaseDate || new Date().toISOString(),
        invoiceUrl: payload.invoiceUrl || null,
        invoiceName: payload.invoiceName || null,
        imageUrls: Array.isArray(payload.imageUrls) ? payload.imageUrls.slice(0, 10) : [],
        performedBy: auth.userId,
        created_date: new Date().toISOString(),
      });
    });
    forceLocalInventory(companyId);
    return { ok: true };
  }

  if (action === "request") {
    if (!rights.canRequest) fail("Material request permission required");
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const item = data.inventoryItems.find((entry) => entry.id === payload.itemId && entry.archived !== true);
      const quantity = Number(payload.quantity);
      const notes = String(payload.notes || "").trim();
      const stationId = rights.senior ? String(payload.stationId || "") : String(auth.stationId || "");
      const sourceStationId = String(payload.sourceStationId || "");
      if (!item || !stationId || !sourceStationId || sourceStationId === stationId || quantity < 1 || !notes) {
        fail("Choose different source and destination stations, an available item, valid quantity and reason");
      }
      if (balanceAt(item, sourceStationId) < quantity) fail("Insufficient stock at the supplying station");
      data.materialRequests.unshift({
        id: uid("req"),
        requesterId: auth.userId,
        stationId,
        sourceStationId,
        itemId: item.id,
        quantity,
        notes,
        status: "pending",
        created_date: new Date().toISOString(),
      });
    });
    notifyInventoryChanged(companyId);
    return { ok: true };
  }

  if (action === "reviewRequest") {
    if (!rights.canReviewRequests) fail("Management permission required");
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const request = data.materialRequests.find((entry) => entry.id === payload.requestId);
      if (!request || request.status !== "pending" || !["approved", "rejected"].includes(payload.decision)) {
        fail("Request cannot be reviewed");
      }
      const reviewedAt = new Date().toISOString();
      if (payload.decision === "rejected") {
        request.status = "rejected";
        request.reviewedBy = auth.userId;
        request.reviewedAt = reviewedAt;
        return;
      }
      const item = data.inventoryItems.find((entry) => entry.id === request.itemId);
      const quantity = Number(request.quantity);
      if (!item || quantity <= 0) fail("A valid requested quantity is required");
      const sourceBefore = balanceAt(item, request.sourceStationId);
      if (sourceBefore < quantity) fail("Insufficient stock at the supplying station");
      const destBefore = balanceAt(item, request.stationId);
      item.locationBalances = adjustBalance(item, request.sourceStationId, -quantity);
      item.locationBalances = adjustBalance(item, request.stationId, quantity);
      item.quantity = item.locationBalances.reduce((sum, entry) => sum + entry.quantity, 0);
      item.currentLocationId = request.stationId;
      data.stockMovements.unshift({
        id: uid("mov"),
        movementNumber: nextMovementNumber(data.stockMovements),
        itemId: item.id,
        movementType: "transfer",
        quantity,
        fromLocationId: request.sourceStationId,
        toLocationId: request.stationId,
        employeeId: request.requesterId,
        requestId: request.id,
        sourceBalanceBefore: sourceBefore,
        sourceBalanceAfter: sourceBefore - quantity,
        destinationBalanceBefore: destBefore,
        destinationBalanceAfter: destBefore + quantity,
        performedBy: auth.userId,
        created_date: reviewedAt,
      });
      request.status = "issued";
      request.reviewedBy = auth.userId;
      request.reviewedAt = reviewedAt;
      request.issuedAt = reviewedAt;
    });
    notifyInventoryChanged(companyId);
    return { ok: true };
  }

  if (action === "issueToWork") {
    if (!rights.canIssueToWork) fail("Station inventory permission required");
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const item = data.inventoryItems.find((entry) => entry.id === payload.itemId && entry.archived !== true);
      const stationId = String(rights.senior ? payload.fromLocationId || "" : auth.stationId || "");
      const quantity = Number(payload.quantity);
      if (!item || !stationId || !payload.employeeId || quantity <= 0) {
        fail("Valid item, station, quantity, recipient and work reference are required");
      }
      const before = balanceAt(item, stationId);
      if (before < quantity) fail("Insufficient station stock");
      item.locationBalances = adjustBalance(item, stationId, -quantity);
      item.quantity = item.locationBalances.reduce((sum, entry) => sum + entry.quantity, 0);
      data.stockMovements.unshift({
        id: uid("mov"),
        movementNumber: nextMovementNumber(data.stockMovements),
        itemId: item.id,
        movementType: "issue",
        quantity,
        fromLocationId: stationId,
        toLocationId: null,
        employeeId: payload.employeeId,
        workReference: payload.workReference,
        workDate: payload.workDate,
        notes: payload.notes || "",
        imageUrls: Array.isArray(payload.imageUrls) ? payload.imageUrls.slice(0, 10) : [],
        balanceBefore: before,
        balanceAfter: before - quantity,
        performedBy: auth.userId,
        created_date: new Date().toISOString(),
      });
    });
    notifyInventoryChanged(companyId);
    return { ok: true };
  }

  if (action === "deleteItem") {
    if (!rights.canDelete) fail("Management permission required");
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const item = data.inventoryItems.find((entry) => entry.id === payload.itemId);
      if (!item) fail("Item not found");
      item.archived = true;
      item.archivedAt = new Date().toISOString();
    });
    notifyInventoryChanged(companyId);
    return { ok: true };
  }

  if (action === "reverseMovement") {
    if (!rights.canReverse) fail("Only senior management can reverse inventory movements", "REVERSE_FORBIDDEN");
    const reversalReason = String(payload.reversalReason || "").trim();
    if (!reversalReason) fail("A reversal reason is required.", "REVERSAL_REASON_REQUIRED");
    updateCompany(companyId, (data) => {
      ensureLedger(data);
      const original = data.stockMovements.find((entry) => entry.id === payload.movementId);
      if (!original || original.isReversal) fail("This movement cannot be reversed", "MOVEMENT_NOT_REVERSIBLE");
      if (original.reversedAt) fail("This movement has already been reversed.", "MOVEMENT_ALREADY_REVERSED");
      const item = data.inventoryItems.find((entry) => entry.id === original.itemId);
      const quantity = Number(original.quantity);
      if (!item || quantity <= 0) fail("Movement item was not found", "MOVEMENT_ITEM_NOT_FOUND");
      const debitStationId = original.movementType === "issue" ? null : original.toLocationId;
      const creditStationId = original.movementType === "purchase" ? null : original.fromLocationId;
      if (debitStationId && balanceAt(item, debitStationId) < quantity) {
        fail("Cannot reverse because current stock is insufficient; the quantity may have been consumed or moved.", "INSUFFICIENT_REVERSAL_STOCK");
      }
      if (debitStationId) item.locationBalances = adjustBalance(item, debitStationId, -quantity);
      if (creditStationId) item.locationBalances = adjustBalance(item, creditStationId, quantity);
      item.quantity = item.locationBalances.reduce((sum, entry) => sum + entry.quantity, 0);
      original.reversedAt = new Date().toISOString();
      original.reversalReason = reversalReason;
      data.stockMovements.unshift({
        id: uid("mov"),
        movementNumber: nextMovementNumber(data.stockMovements),
        itemId: item.id,
        movementType: "reversal",
        isReversal: true,
        reversalMovementId: original.id,
        quantity,
        fromLocationId: debitStationId,
        toLocationId: creditStationId,
        notes: reversalReason,
        reversalReason,
        performedBy: auth.userId,
        created_date: original.reversedAt,
      });
    });
    notifyInventoryChanged(companyId);
    return { ok: true };
  }

  fail("Unknown action");
  return { ok: false };
}

function stockRowsFromLedger(data, scope = "all") {
  ensureLedger(data);
  const rows = [];
  (data.inventoryItems || []).filter((item) => item.archived !== true).forEach((item) => {
    balancesOf(item).forEach((entry) => {
      if (scope !== "all" && String(entry.locationId) !== String(scope)) return;
      rows.push(enrichStockItem({
        id: `${item.id}-${entry.locationId}`,
        sku: item.itemCode,
        name: item.name,
        stationId: entry.locationId,
        onHand: entry.quantity,
        reorder: Number(item.minimumStock) || 0,
        leadDays: Number(item.leadDays) || 7,
        onOrder: !!item.onOrder,
        poId: item.poId || null,
      }));
    });
  });
  return rows;
}

export function localStockCall(companyId, payload = {}) {
  const action = String(payload.action || "list");
  const scope = String(payload.scope || "all");
  const data = getCompanyData(companyId) || { stations: [] };
  ensureLedger(data);

  const enrich = () => {
    const items = stockRowsFromLedger(getCompanyData(companyId) || data, scope);
    return {
      ok: true,
      scope,
      items,
      alert: deriveStockAlert(items),
      purchaseOrders: (getCompanyData(companyId)?.stockPurchaseOrders || []).filter(
        (order) => !order.scope || order.scope === scope || scope === "all",
      ),
      poRaised: !!(getCompanyData(companyId)?.stockRaisedScopes || {})[scope],
    };
  };

  if (action === "list" || action === "seedDemo") return enrich();

  if (action === "raisePo") {
    let result = null;
    updateCompany(companyId, (next) => {
      ensureLedger(next);
      const items = stockRowsFromLedger(next, scope);
      const gate = checkRaisePoGate(items, { alreadyRaised: !!next.stockRaisedScopes[scope] });
      if (!gate.ok) fail(gate.reason || gate.error, gate.error);
      const po = {
        id: uid("po"),
        scope,
        skuKeys: gate.skuKeys,
        maxLeadDays: gate.maxLeadDays,
        raisedAt: new Date().toISOString(),
        status: "open",
      };
      next.stockPurchaseOrders = [po, ...(next.stockPurchaseOrders || [])];
      next.stockRaisedScopes = { ...next.stockRaisedScopes, [scope]: po.id };
      next.inventoryItems = applyPoToItems(
        next.inventoryItems.map((item) => ({ ...item, sku: item.itemCode })),
        po,
      ).map(({ sku, ...item }) => item);
      result = { ok: true, po, lines: gate.lines, maxLeadDays: gate.maxLeadDays };
    });
    return { ...enrich(), ...result };
  }

  return enrich();
}
