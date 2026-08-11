import assert from "node:assert/strict";
import {
  CRITICAL_RATIO,
  deriveStockStatus,
  enrichStockItem,
  deriveStockAlert,
  checkIssueStockGate,
  checkRaisePoGate,
  applyPoToItems,
  clearOnOrderIfFilled,
  fillRatio,
} from "../src/lib/inventoryDerivations.js";

assert.equal(CRITICAL_RATIO, 0.5);
assert.equal(deriveStockStatus({ sku: "A", name: "A", onHand: 1, reorder: 6 }), "critical"); // 1/6 < 0.5
assert.equal(deriveStockStatus({ sku: "B", name: "B", onHand: 3, reorder: 12 }), "critical");
assert.equal(deriveStockStatus({ sku: "C", name: "C", onHand: 8, reorder: 10 }), "low");
assert.equal(deriveStockStatus({ sku: "D", name: "D", onHand: 4, reorder: 8 }), "low"); // 0.5 → low
assert.equal(deriveStockStatus({ sku: "E", name: "E", onHand: 42, reorder: 20 }), "ok");
assert.equal(deriveStockStatus({ sku: "F", name: "F", onHand: 1, reorder: 6, onOrder: true }), "on_order");

assert.equal(fillRatio(1, 6), 17);
assert.equal(enrichStockItem({ sku: "E", name: "E", onHand: 42, reorder: 20 }).fillPct, 100);

const items = [
  { sku: "SPR-1042", name: "Valve", onHand: 1, reorder: 6, leadDays: 21, stationId: "jbl2" },
  { sku: "CON-0330", name: "Oil", onHand: 8, reorder: 10, leadDays: 7, stationId: "jbl1" },
  { sku: "PPE-0120", name: "Gloves", onHand: 42, reorder: 20, leadDays: 5, stationId: "shb" },
];
const alert = deriveStockAlert(items);
assert.equal(alert.criticalCount, 1);
assert.equal(alert.shortCount, 2);
assert.equal(alert.stationsAffected, 2);
assert.equal(alert.maxLeadDays, 21);

assert.equal(checkIssueStockGate(items[0], 2).error, "INSUFFICIENT_STOCK");
assert.equal(checkIssueStockGate(items[0], 1).ok, true);

assert.equal(checkRaisePoGate([]).error, "NO_SHORT_SKUS");
assert.equal(checkRaisePoGate(items, { alreadyRaised: true }).error, "ALREADY_RAISED");
const poGate = checkRaisePoGate(items);
assert.equal(poGate.ok, true);
assert.equal(poGate.skuKeys.length, 2);
assert.equal(poGate.maxLeadDays, 21);

const after = applyPoToItems(items, { id: "po1", skuKeys: poGate.skuKeys });
assert.equal(deriveStockStatus(after[0]), "on_order");
assert.equal(deriveStockStatus(after[2]), "ok");

const filled = clearOnOrderIfFilled({ ...after[0], onHand: 6, onOrder: true, poId: "po1" });
assert.equal(filled.onOrder, false);
assert.equal(filled.poId, null);

console.log("inventory derivations ok");
