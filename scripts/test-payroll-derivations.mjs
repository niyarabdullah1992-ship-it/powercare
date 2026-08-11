import assert from "node:assert/strict";
import {
  OT_RATE,
  hourlyFromBase,
  overtimePay,
  lineNet,
  qiwaMatches,
  enrichLine,
  deriveRunTotals,
  wpsDeadline,
  isWpsLate,
  checkApprovePayrollGate,
  checkSendWpsGate,
  deriveStationBreakdown,
} from "../src/lib/payrollDerivations.js";

assert.equal(OT_RATE, 1.5);
assert.equal(hourlyFromBase(2400), 10); // 2400 / (30*8)
assert.equal(overtimePay(2400, 10), 150); // 10 * 10 * 1.5

const good = {
  id: "1",
  employeeId: "e1",
  base: 9800,
  allowances: 2600,
  bonus: 0,
  overtimeHours: 10,
  deductions: 100,
  currency: "SAR",
  qiwaWage: 12400,
  stationId: "jbl1",
};
const enriched = enrichLine(good);
assert.ok(enriched.overtimePay > 0);
assert.equal(qiwaMatches(good), true);
assert.equal(qiwaMatches({ ...good, qiwaWage: 10000 }), false);
assert.equal(qiwaMatches({ ...good, qiwaWage: null }), false);
assert.ok(lineNet(enriched) > 0);

assert.equal(wpsDeadline("2026-08"), "2026-09-03");
assert.equal(wpsDeadline("2026-12"), "2027-01-03");
assert.equal(isWpsLate("2026-08", new Date(2026, 8, 4)), true); // Sep 4
assert.equal(isWpsLate("2026-08", new Date(2026, 8, 3)), false);

assert.equal(checkApprovePayrollGate(null).error, "RUN_NOT_FOUND");
assert.equal(checkApprovePayrollGate({ month: "2026-08", items: [] }).error, "EMPTY_RUN");
assert.equal(checkApprovePayrollGate({ month: "2026-08", status: "approved", items: [good] }).error, "ALREADY_APPROVED");
assert.equal(
  checkApprovePayrollGate({ month: "2026-08", items: [{ ...good, base: 0 }] }).error,
  "ITEM_ISSUES",
);
assert.equal(checkApprovePayrollGate({ month: "2026-08", status: "draft", items: [good] }).ok, true);

assert.equal(checkSendWpsGate({ month: "2026-08", status: "draft", items: [good] }).error, "RUN_NOT_APPROVED");
assert.equal(
  checkSendWpsGate({
    month: "2026-08",
    status: "approved",
    items: [{ ...good, qiwaWage: 1 }],
  }).error,
  "QIWA_MISMATCH",
);
assert.equal(
  checkSendWpsGate({ month: "2026-08", status: "approved", items: [good] }, new Date(2026, 7, 20)).ok,
  true,
);

const totals = deriveRunTotals([good, { ...good, id: "2", employeeId: "e2", stationId: "ynb", overtimeHours: 0 }]);
assert.equal(totals.heads, 2);
assert.equal(totals.qiwaMatched, 2);

const by = deriveStationBreakdown([good, { ...good, id: "2", employeeId: "e2", stationId: "ynb" }]);
assert.equal(by.length, 2);

console.log("payroll derivations ok");
