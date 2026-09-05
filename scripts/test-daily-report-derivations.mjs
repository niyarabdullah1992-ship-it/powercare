import assert from "node:assert/strict";
import {
  isLateSubmit,
  deriveDailyRowStatus,
  checkApproveDailyGate,
  checkApproveDailyRoleGate,
  checkFileDailyGate,
  checkCloseShiftDailyGate,
  checkIssueSignedDailyGate,
  buildShortDailyNote,
  deriveDailySummary,
  deriveStationFacts,
  canFileDailyRole,
  canApproveDailyRole,
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
assert.equal(row.canCloseShift, false);

const approvedLate = deriveDailyRowStatus({ ...filed, approved: true });
assert.equal(approvedLate.approved, true);
assert.equal(approvedLate.isLate, true); // approval must not erase lateness
assert.equal(approvedLate.lateChip, true);
assert.equal(approvedLate.canCloseShift, true);

assert.equal(checkApproveDailyGate({ stationId: "s1" }).error, "NOT_FILED");
assert.equal(checkApproveDailyGate(filed).ok, true);
assert.equal(checkApproveDailyGate(filed).isLate, true);

assert.equal(canFileDailyRole("station_manager"), true);
assert.equal(canApproveDailyRole("station_manager"), false);
assert.equal(canApproveDailyRole("ops_manager"), true);
assert.equal(checkApproveDailyRoleGate("station_manager").error, "FORBIDDEN_APPROVE");
assert.equal(checkFileDailyGate({ role: "station_manager", stationId: "s1", userStationId: "s1" }).ok, true);
assert.equal(checkFileDailyGate({ role: "station_manager", stationId: "s2", userStationId: "s1" }).error, "STATION_SCOPE");

assert.equal(checkCloseShiftDailyGate(null).error, "SHIFT_OPEN_NOT_FILED");
assert.equal(checkCloseShiftDailyGate(filed).error, "SHIFT_OPEN_NOT_APPROVED");
assert.equal(checkCloseShiftDailyGate({ ...filed, approved: true }).ok, true);

assert.equal(checkIssueSignedDailyGate({ rows: [filed], alreadyIssued: false }).error, "NOT_ALL_APPROVED");
assert.equal(checkIssueSignedDailyGate({ rows: [{ approved: true }], alreadyIssued: true }).error, "ALREADY_ISSUED");
assert.equal(checkIssueSignedDailyGate({ rows: [{ approved: true }], alreadyIssued: false }).ok, true);

const facts = deriveStationFacts({ tasksClosed: 2, openHazards: 1, unexcusedAbsences: 0, proofsApproved: 3 });
assert.equal(facts.length, 4);
assert.equal(facts[1].bad, true);
assert.match(buildShortDailyNote(facts, true), /مهام مغلقة 2/);

const summary = deriveDailySummary([
  { filedAt: "13:00", isLate: false, canApprove: true, missing: false },
  { filedAt: "—", isLate: true, canApprove: false, missing: true },
  { filedAt: "14:30", isLate: true, canApprove: false, missing: false, approved: true },
]);
assert.equal(summary.submitted, 2);
assert.equal(summary.late, 2);
assert.equal(summary.missing, 1);
assert.equal(summary.closable, 1);

console.log("dailyReport derivations: PASS");
