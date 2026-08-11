import assert from "node:assert/strict";
import {
  isLateSubmit,
  deriveDailyRowStatus,
  checkApproveDailyGate,
  deriveDailySummary,
  deriveStationFacts,
  DEFAULT_SHIFT_END,
} from "../src/lib/dailyReportDerivations.js";

assert.equal(DEFAULT_SHIFT_END, "14:00");
assert.equal(isLateSubmit("13:59"), false);
assert.equal(isLateSubmit("14:01"), true);
assert.equal(isLateSubmit(null), false);

const filed = { stationId: "s1", filedAt: "14:20", approved: false };
const row = deriveDailyRowStatus(filed);
assert.equal(row.isLate, true);
assert.equal(row.canApprove, true);
assert.equal(row.status, "late");

const approvedLate = deriveDailyRowStatus({ ...filed, approved: true });
assert.equal(approvedLate.approved, true);
assert.equal(approvedLate.isLate, true); // approval must not erase lateness
assert.equal(approvedLate.lateChip, true);

assert.equal(checkApproveDailyGate({ stationId: "s1" }).error, "NOT_FILED");
assert.equal(checkApproveDailyGate(filed).ok, true);
assert.equal(checkApproveDailyGate(filed).isLate, true);

const facts = deriveStationFacts({ tasksClosed: 2, openHazards: 1, unexcusedAbsences: 0, proofsApproved: 3 });
assert.equal(facts.length, 4);
assert.equal(facts[1].bad, true);

const summary = deriveDailySummary([
  { filedAt: "13:00", isLate: false, canApprove: true, missing: false },
  { filedAt: "—", isLate: true, canApprove: false, missing: true },
  { filedAt: "14:30", isLate: true, canApprove: false, missing: false, approved: true },
]);
assert.equal(summary.submitted, 2);
assert.equal(summary.late, 2);
assert.equal(summary.missing, 1);

console.log("dailyReport derivations: PASS");
