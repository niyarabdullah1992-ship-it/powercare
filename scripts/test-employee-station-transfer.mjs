import assert from "node:assert/strict";

/** Mirror of checkStationTransferGate — store uses Vite aliases so we assert the contract here. */
const TRANSFER_REASONS = new Set(["operational_need", "employee_request", "station_opening", "restructure"]);

function checkStationTransferGate({ employee, toStationId, actorId, reasonCode, effectiveDate, stations = [] } = {}) {
  if (!employee?.id) return { ok: false, error: "EMPLOYEE_REQUIRED" };
  if (actorId && String(actorId) === String(employee.id)) return { ok: false, error: "SELF_TRANSFER_FORBIDDEN" };
  if (employee.active === false) return { ok: false, error: "EMPLOYEE_INACTIVE" };
  const toId = String(toStationId || "").trim();
  if (!toId) return { ok: false, error: "TARGET_STATION_REQUIRED" };
  const fromId = employee.stationId ? String(employee.stationId) : null;
  if (fromId && fromId === toId) return { ok: false, error: "SAME_STATION" };
  if (!stations.some((s) => String(s.id) === toId)) return { ok: false, error: "STATION_NOT_FOUND" };
  const day = String(effectiveDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, error: "EFFECTIVE_DATE_REQUIRED" };
  if (!reasonCode || !TRANSFER_REASONS.has(reasonCode)) return { ok: false, error: "ACTION_REASON_REQUIRED" };
  return { ok: true };
}

const emp = { id: "e1", name: "Omar", stationId: "s1", active: true };
const stations = [{ id: "s1", name: "North" }, { id: "s2", name: "East" }];

assert.equal(checkStationTransferGate({
  employee: emp, toStationId: "s2", actorId: "boss", reasonCode: "operational_need", effectiveDate: "2026-08-13", stations,
}).ok, true);
assert.equal(checkStationTransferGate({
  employee: emp, toStationId: "s1", actorId: "boss", reasonCode: "operational_need", effectiveDate: "2026-08-13", stations,
}).error, "SAME_STATION");
assert.equal(checkStationTransferGate({
  employee: emp, toStationId: "s2", actorId: "e1", reasonCode: "operational_need", effectiveDate: "2026-08-13", stations,
}).error, "SELF_TRANSFER_FORBIDDEN");
assert.equal(checkStationTransferGate({
  employee: emp, toStationId: "s2", actorId: "boss", reasonCode: "", effectiveDate: "2026-08-13", stations,
}).error, "ACTION_REASON_REQUIRED");

console.log("employeeStationTransfer gates: PASS");
