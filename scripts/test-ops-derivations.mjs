import assert from "node:assert/strict";
import {
  taskPoints,
  planHorizonFromDue,
  deriveOpsCounts,
  clampEffortWeight,
} from "../src/lib/opsDerivations.js";

// Gate rules mirrored from base44/shared/opsDerivations.ts for Node tests.
const CERT_FOR = { pm: "loto", cm: "loto", em: "fa", pr: "wah", cp: null };

function employeeLacksCert(owner, required, today) {
  if (!required) return false;
  const certs = owner.certificates || [];
  return !certs.some((c) => {
    const code = String(c.code || "").toLowerCase();
    if (code !== required) return false;
    if (String(c.status || "").toLowerCase() === "expired") return false;
    if (!c.expiryDate) return true;
    return new Date(`${c.expiryDate}T23:59:59`) >= new Date(today.toDateString());
  });
}

function checkAssignGate({ workKind, assignMode, ownerId, memberIds = [], people, today = new Date() }) {
  const required = CERT_FOR[workKind];
  if (!required) return { ok: true, required: null, blocked: [] };
  const byId = new Map(people.map((p) => [p.employeeId, p]));
  let candidates = [];
  if (assignMode === "one") {
    if (!ownerId || !byId.has(ownerId)) return { ok: false, reason: "owner missing from company" };
    candidates = [byId.get(ownerId)];
  } else if (assignMode === "some") {
    if (!memberIds.length || memberIds.some((id) => !byId.has(id))) return { ok: false, reason: "member missing" };
    candidates = memberIds.map((id) => byId.get(id));
  } else {
    candidates = people;
    if (!candidates.length) return { ok: false, reason: "empty crew" };
  }
  const blocked = candidates.filter((p) => employeeLacksCert(p, required, today));
  if (!blocked.length) return { ok: true, required, blocked: [] };
  return { ok: false, reason: `Cannot assign: ${required} certification has lapsed`, blocked };
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

const people = [
  { employeeId: "e1", name: "Lapsed", certificates: [{ code: "loto", expiryDate: "2020-01-01", status: "expired" }] },
  { employeeId: "e2", name: "Valid", certificates: [{ code: "loto", expiryDate: "2027-01-01", status: "approved" }] },
];

assert.equal(checkAssignGate({ workKind: "pm", assignMode: "one", ownerId: "e1", people, today }).ok, false);
assert.equal(checkAssignGate({ workKind: "pm", assignMode: "one", ownerId: "e2", people, today }).ok, true);
assert.equal(checkAssignGate({ workKind: "pm", assignMode: "one", ownerId: "ghost", people, today }).ok, false);
assert.equal(checkAssignGate({ workKind: "cp", assignMode: "one", ownerId: "e1", people, today }).ok, true);
assert.equal(taskPoints("high", 3), 9);

console.log("opsDerivations E2E rules: PASS");
