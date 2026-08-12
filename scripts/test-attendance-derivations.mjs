import assert from "node:assert/strict";
import {
  ATT_STATUS,
  GEO_VERDICT,
  GRACE_MINUTES,
  SETTLEMENT_WINDOW_DAYS,
  SHIFT_HOURS,
  buildRosterRow,
  checkOtDecisionGate,
  checkOutOfGeofenceGate,
  checkSettleAbsenceGate,
  deriveAttStats,
  deriveDayStatus,
  filterRosterByStatus,
  localDateKey,
  localDayDiff,
} from "../src/lib/attendanceDerivations.js";

assert.equal(GRACE_MINUTES, 10);
assert.equal(SHIFT_HOURS, 8);
assert.equal(SETTLEMENT_WINDOW_DAYS, 45);

// Present within grace
const onTime = deriveDayStatus({ checkIn: "07:08", checkOut: "15:10" }, { shiftStart: "07:00" });
assert.equal(onTime.status, ATT_STATUS.present);
assert.equal(onTime.lateMinutes, 0);

// Late after grace
const late = deriveDayStatus({ checkIn: "07:25", checkOut: "15:30" }, { shiftStart: "07:00" });
assert.equal(late.status, ATT_STATUS.late);
assert.equal(late.lateMinutes, 15);

// OT beyond 8h
const ot = deriveDayStatus({ checkIn: "07:00", checkOut: "16:30" }, { shiftStart: "07:00" });
assert.equal(ot.ordinaryMinutes, 480);
assert.equal(ot.overtimeMinutes, 90);

// Absent / leave
assert.equal(deriveDayStatus({}).status, ATT_STATUS.absent);
assert.equal(deriveDayStatus({ onLeave: true }).status, ATT_STATUS.leave);

// Local date parts — not UTC ISO drift
const key = localDateKey(new Date(2026, 7, 12));
assert.equal(key, "2026-08-12");
assert.equal(localDayDiff("2026-08-01", "2026-08-12"), 11);

// Geofence gate names reason
const needReason = checkOutOfGeofenceGate({ geoVerdict: "outside", decision: "accept", reason: "" });
assert.equal(needReason.ok, false);
assert.equal(needReason.error, "REASON_REQUIRED");
assert.match(needReason.reasonEn, /written reason/i);

const acceptOk = checkOutOfGeofenceGate({
  geoVerdict: "outside",
  decision: "accept",
  reason: "Emergency call-out",
});
assert.equal(acceptOk.ok, true);

// Settlement window
const closed = checkSettleAbsenceGate({
  absenceDate: "2026-01-01",
  today: "2026-08-12",
  kind: "sick",
  documentName: "note.pdf",
});
assert.equal(closed.ok, false);
assert.equal(closed.error, "SETTLEMENT_WINDOW_CLOSED");

const settleOk = checkSettleAbsenceGate({
  absenceDate: "2026-08-01",
  today: "2026-08-12",
  kind: "sick",
  documentName: "note.pdf",
});
assert.equal(settleOk.ok, true);

const noDoc = checkSettleAbsenceGate({
  absenceDate: "2026-08-01",
  today: "2026-08-12",
  kind: "sick",
  documentName: "",
});
assert.equal(noDoc.ok, false);
assert.equal(noDoc.error, "DOCUMENT_REQUIRED");

// OT decision — hours remain either way
const otGate = checkOtDecisionGate({ overtimeMinutes: 90, decision: "approve" });
assert.equal(otGate.ok, true);
assert.equal(checkOtDecisionGate({ overtimeMinutes: 0, decision: "approve" }).error, "NO_OVERTIME");

// Roster + chips filter by stable IDs
const rows = [
  buildRosterRow({ employeeId: "a", checkIn: "07:00", checkOut: "15:00", geoVerdict: "inside" }),
  buildRosterRow({ employeeId: "b", checkIn: "07:40", checkOut: "15:00", geoVerdict: "inside" }),
  buildRosterRow({ employeeId: "c", geoVerdict: "outside" }),
  buildRosterRow({
    employeeId: "d",
    checkIn: "07:00",
    checkOut: "15:00",
    geoVerdict: "outside",
    geoDecision: { decision: "reject", reason: "x" },
  }),
];
assert.equal(rows[0].status, ATT_STATUS.present);
assert.equal(rows[1].status, ATT_STATUS.late);
assert.equal(rows[2].status, ATT_STATUS.absent);
assert.equal(rows[2].geo, GEO_VERDICT.pending_review);
assert.equal(rows[3].status, ATT_STATUS.absent);
assert.equal(rows[3].geo, GEO_VERDICT.rejected_outside);

const lateOnly = filterRosterByStatus(rows, ATT_STATUS.late);
assert.equal(lateOnly.length, 1);
assert.equal(lateOnly[0].employeeId, "b");

const stats = deriveAttStats(rows, true);
assert.equal(stats.graceMinutes, 10);
assert.ok(stats.rate >= 0 && stats.rate <= 100);
assert.ok(stats.outsideNeedingReview >= 1);

console.log("attendanceDerivations E2E rules: PASS");
