import assert from "node:assert/strict";
import {
  taskPoints,
  planHorizonFromDue,
  deriveOpsCounts,
  clampEffortWeight,
  checkAssignGate,
  CERT_FOR,
  CERT_LABELS,
  isAwaitingApproval,
} from "../src/lib/opsDerivations.js";

// ── Points formula (High 3 · Medium 2 · Low 1) × effort (1–5) ───────────────
assert.equal(taskPoints("high", 4), 12);
assert.equal(taskPoints("medium", 3), 6);
assert.equal(taskPoints("low", 5), 5);
assert.equal(taskPoints("high", 3), 9);
assert.equal(clampEffortWeight(99), 5);
assert.equal(clampEffortWeight(0), 1);
assert.equal(CERT_FOR.pm, "loto");
assert.equal(CERT_FOR.em, "fa");
assert.equal(CERT_FOR.cp, null);

// Points are computed at approval time from the same formula — logging completion
// must never invent a different scale.
const worth = taskPoints("medium", 2);
assert.equal(worth, 4);
assert.ok(worth !== 100 && worth !== 75, "must not use legacy 100/75 priority scale");

// ── Plan horizon from local date parts ───────────────────────────────────────
const today = new Date("2026-08-11T12:00:00");
assert.equal(planHorizonFromDue("2026-08-15", today), "w");
assert.equal(planHorizonFromDue("2026-09-01", today), "m");
assert.equal(planHorizonFromDue("2026-11-01", today), "q");
assert.equal(planHorizonFromDue("2027-01-01", today), "h");
assert.equal(planHorizonFromDue("2027-08-01", today), "y");
assert.equal(planHorizonFromDue(null, today), "w");

// ── Derived counters (never stored literals) ─────────────────────────────────
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
assert.equal(counts.badge, 2);

assert.equal(isAwaitingApproval({ status: "active", completedCount: 2, targetCount: 2 }), true);
assert.equal(isAwaitingApproval({ status: "completed", completedCount: 2, targetCount: 2, approvedAt: "2026-08-10" }), false);

// ── Certification gate — names the missing certificate in all assign modes ───
const people = [
  { employeeId: "e1", name: "Lapsed", certificates: [{ code: "loto", expiryDate: "2020-01-01", status: "expired" }] },
  { employeeId: "e2", name: "Valid", certificates: [{ code: "loto", expiryDate: "2027-01-01", status: "approved" }] },
  { employeeId: "e3", name: "NoFa", certificates: [{ code: "loto", expiryDate: "2027-01-01", status: "approved" }] },
];

const oneBlocked = checkAssignGate({
  workKind: "pm",
  assignMode: "one",
  ownerId: "e1",
  people,
  lang: "en",
  today,
});
assert.equal(oneBlocked.ok, false);
assert.equal(oneBlocked.required, "loto");
assert.equal(oneBlocked.certLabel, CERT_LABELS.loto.en);
assert.match(oneBlocked.reason, /Lock-out \/ tag-out/);

const oneOk = checkAssignGate({
  workKind: "pm",
  assignMode: "one",
  ownerId: "e2",
  people,
  lang: "en",
  today,
});
assert.equal(oneOk.ok, true);

const ghost = checkAssignGate({
  workKind: "pm",
  assignMode: "one",
  ownerId: "ghost",
  people,
  lang: "en",
  today,
});
assert.equal(ghost.ok, false);

const someBlocked = checkAssignGate({
  workKind: "pm",
  assignMode: "some",
  memberIds: ["e1", "e2"],
  people,
  lang: "ar",
  today,
});
assert.equal(someBlocked.ok, false);
assert.match(someBlocked.reason, /العزل والوسم LOTO/);
assert.match(someBlocked.reason, /Lapsed/);
assert.equal(someBlocked.blocked.length, 1);

const allBlocked = checkAssignGate({
  workKind: "pm",
  assignMode: "all",
  stationId: "st1",
  people: [people[0], people[1]],
  lang: "en",
  today,
});
assert.equal(allBlocked.ok, false);
assert.match(allBlocked.reason, /whole station crew/);
assert.match(allBlocked.reason, /Lock-out \/ tag-out/);

const emGate = checkAssignGate({
  workKind: "em",
  assignMode: "one",
  ownerId: "e3",
  people,
  lang: "en",
  today,
});
assert.equal(emGate.ok, false);
assert.equal(emGate.required, "fa");
assert.match(emGate.reason, /First aid/);

const cpOk = checkAssignGate({
  workKind: "cp",
  assignMode: "one",
  ownerId: "e1",
  people,
  lang: "en",
  today,
});
assert.equal(cpOk.ok, true);
assert.equal(cpOk.required, null);

console.log("opsDerivations E2E rules: PASS");
