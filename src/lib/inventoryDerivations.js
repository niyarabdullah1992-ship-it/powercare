/** Client mirror of base44/shared/inventoryDerivations.ts */

export const CRITICAL_RATIO = 0.5;

export function fillRatio(onHand, reorder) {
  const r = Number(reorder) || 0;
  if (r <= 0) return Number(onHand) > 0 ? 100 : 0;
  return Math.min(100, Math.round((Math.max(0, Number(onHand) || 0) / r) * 100));
}

export function deriveStockStatus(item) {
  if (item.onOrder) return "on_order";
  const onHand = Math.max(0, Number(item.onHand) || 0);
  const reorder = Math.max(0, Number(item.reorder) || 0);
  if (reorder <= 0) return onHand > 0 ? "ok" : "critical";
  if (onHand >= reorder) return "ok";
  if (onHand / reorder < CRITICAL_RATIO) return "critical";
  return "low";
}

export function isShortSku(item) {
  const status = deriveStockStatus(item);
  return status === "critical" || status === "low";
}

export function enrichStockItem(item) {
  const onHand = Math.max(0, Number(item.onHand) || 0);
  const reorder = Math.max(0, Number(item.reorder) || 0);
  const status = deriveStockStatus({ ...item, onHand, reorder });
  return {
    ...item,
    onHand,
    reorder,
    leadDays: Math.max(0, Number(item.leadDays) || 0),
    status,
    shortfall: Math.max(0, reorder - onHand),
    fillPct: status === "ok" ? 100 : fillRatio(onHand, reorder),
    short: status === "critical" || status === "low",
  };
}

export function deriveStockAlert(items = []) {
  const enriched = items.map(enrichStockItem);
  const short = enriched.filter((i) => i.short);
  const critical = enriched.filter((i) => i.status === "critical");
  const onOrder = enriched.filter((i) => i.status === "on_order");
  const stations = new Set(short.map((i) => i.stationId).filter(Boolean));
  const maxLead = short.reduce((m, i) => Math.max(m, i.leadDays || 0), 0)
    || onOrder.reduce((m, i) => Math.max(m, i.leadDays || 0), 0);
  return {
    shortCount: short.length,
    criticalCount: critical.length,
    onOrderCount: onOrder.length,
    stationsAffected: stations.size,
    maxLeadDays: maxLead,
    covered: short.length === 0 && onOrder.length > 0,
  };
}

export function shortfallQty(item) {
  return Math.max(0, (Math.max(0, Number(item.reorder) || 0) - Math.max(0, Number(item.onHand) || 0)));
}

export function checkIssueStockGate(item, qty) {
  if (!item) return { ok: false, error: "ITEM_NOT_FOUND", reason: "الصنف غير موجود.", reasonEn: "Stock item not found." };
  const q = Number(qty);
  if (!Number.isFinite(q) || q <= 0) {
    return { ok: false, error: "QTY_REQUIRED", reason: "الكمية يجب أن تكون أكبر من صفر.", reasonEn: "Quantity must be greater than zero." };
  }
  const onHand = Math.max(0, Number(item.onHand) || 0);
  if (q > onHand) {
    return {
      ok: false,
      error: "INSUFFICIENT_STOCK",
      reason: `لا يكفي المخزون — المتاح ${onHand}.`,
      reasonEn: `Insufficient stock — ${onHand} on hand.`,
      onHand,
      requested: q,
    };
  }
  return { ok: true, onHand, requested: q, nextOnHand: onHand - q };
}

export function checkReceiveStockGate(item, qty) {
  if (!item) return { ok: false, error: "ITEM_NOT_FOUND", reason: "الصنف غير موجود.", reasonEn: "Stock item not found." };
  const q = Number(qty);
  if (!Number.isFinite(q) || q <= 0) {
    return { ok: false, error: "QTY_REQUIRED", reason: "الكمية يجب أن تكون أكبر من صفر.", reasonEn: "Quantity must be greater than zero." };
  }
  return { ok: true, nextOnHand: Math.max(0, Number(item.onHand) || 0) + q };
}

export function checkRaisePoGate(items = [], { alreadyRaised = false } = {}) {
  if (alreadyRaised) {
    return {
      ok: false,
      error: "ALREADY_RAISED",
      reason: "أمر الشراء أُنشئ بالفعل لهذا النطاق.",
      reasonEn: "The purchase order is already raised for this scope.",
    };
  }
  const short = items.map(enrichStockItem).filter((i) => i.short);
  if (!short.length) {
    return {
      ok: false,
      error: "NO_SHORT_SKUS",
      reason: "لا أصناف ناقصة تحتاج أمر شراء.",
      reasonEn: "No short SKUs need a purchase order.",
    };
  }
  const maxLeadDays = short.reduce((m, i) => Math.max(m, i.leadDays || 0), 0);
  return {
    ok: true,
    lines: short.map((i) => ({
      sku: i.sku,
      name: i.name,
      stationId: i.stationId || null,
      qty: shortfallQty(i) || 1,
      leadDays: i.leadDays || 0,
    })),
    maxLeadDays,
    skuKeys: short.map((i) => i.sku),
  };
}

export function applyPoToItems(items, po) {
  const set = new Set(po.skuKeys || []);
  return items.map((item) => (set.has(item.sku) ? { ...item, onOrder: true, poId: po.id } : item));
}

export function clearOnOrderIfFilled(item) {
  const onHand = Math.max(0, Number(item.onHand) || 0);
  const reorder = Math.max(0, Number(item.reorder) || 0);
  if (item.onOrder && onHand >= reorder) return { ...item, onOrder: false, poId: null };
  return item;
}
