import assert from "node:assert/strict";
import {
  taskPoints,
  planHorizonFromDue,
  deriveOpsCounts,
  clampEffortWeight,
} from "../src/lib/opsDerivations.js";

// Re-implement gate checks against the same rules (server module is Deno TS).
const CERT_FOR = { pm: "loto", cm: "loto", em: "fa", pr: "wah", cp: null };

function checkAssignGate({ workKind, owner, today = new Date() }) {
  const required = CERT_FOR[workKind];
  if (!required) return { ok: true };
  const certs = owner.certificates || [];
  const current = certs.some((c) => {
    const code = String(c.code || "").toLowerCase();
    if (code !== required) return false;
    if (!c.expiryDate) return c.status !== "expired";
    return new Date(`${c.expiryDate}T23:59:59`) >= new Date(today.toDateString());
  });
  return current
    ? { ok: true }
    : { ok: false, reason: `Cannot assign: ${required} certification has lapsed` };
}

assert.equal(taskPoints("high", 4), 12);
assert.equal(taskPoints("medium", 3), 6);
assert.equal(taskPoints("low", 5), 5);
assert.equal(clampEffortWeight(99), 5);
assert.equal(clampEffortWeight(0), 1);

const today = new Date("2026-08-11T12:00:00");
assert.equal(planHorizonFromDue("2026-08-15", today), "w");
assert.equal(planHorizonFromDue("2026-09-01", today), "m");
assert.equal(planHorizonFromDue("2026-11-01", today), "q");
assert.equal(planHorizonFromDue("2027-01-01", today), "h");
assert.equal(planHorizonFromDue("2027-08-01", today), "y");

const counts = deriveOpsCounts([
  { status: "active", dueAt: "2026-08-01", completedCount: 0, targetCount: 1 },
  { status: "awaiting_approval", dueAt: "2026-08-11", completedCount: 1, targetCount: 1 },
  { status: "completed", approvedAt: "2026-08-10", dueAt: "2026-08-10", completedCount: 1, targetCount: 1, pointsAwarded: 6 },
], today);
assert.equal(counts.total, 3);
assert.equal(counts.overdue, 1);
assert.equal(counts.today, 1);
assert.equal(counts.awaiting, 1);
assert.equal(counts.done, 1);
assert.equal(counts.pointsAwarded, 6);

const blocked = checkAssignGate({
  workKind: "pm",
  owner: { employeeId: "e1", certificates: [{ code: "loto", expiryDate: "2020-01-01", status: "expired" }] },
  today,
});
assert.equal(blocked.ok, false);
assert.match(blocked.reason, /loto/i);

const allowed = checkAssignGate({
  workKind: "pm",
  owner: { employeeId: "e2", certificates: [{ code: "loto", expiryDate: "2027-01-01", status: "approved" }] },
  today,
});
assert.equal(allowed.ok, true);

// Points are a pure function of priority×weight — approval is a separate step (server awards only then).
const pendingPoints = taskPoints("high", 3);
assert.equal(pendingPoints, 9);

console.log("opsDerivations E2E rules: PASS");
