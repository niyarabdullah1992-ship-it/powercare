import assert from "node:assert/strict";
import {
  taskPoints,
  planHorizonFromDue,
  taskPlanHorizon,
  deriveHorizonGroups,
  deriveOpsCounts,
  clampEffortWeight,
  checkAssignGate,
  checkReassignGate,
  canReassignOpsTask,
  applyOpsReassign,
  assignmentHistoryNote,
  CERT_FOR,
  CERT_LABELS,
  isAwaitingApproval,
  deriveDailyTaskPace,
  deriveBoardDailyPace,
  dailyPaceLabel,
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

// Live remaining days — stored horizon is ignored unless pinned
assert.equal(taskPlanHorizon({ dueAt: "2026-08-15", planHorizon: "q" }, today), "w");
assert.equal(taskPlanHorizon({ dueAt: "2026-09-01", planHorizon: "y" }, today), "m");
assert.equal(taskPlanHorizon({ dueAt: "2026-08-15", planHorizon: "y", planPinned: true }, today), "y");
assert.equal(taskPlanHorizon({ dueAt: null, planHorizon: "q" }, today), "w");

const liveGroups = deriveHorizonGroups([
  { dueAt: "2026-08-15", planHorizon: "q", completedCount: 0, targetCount: 1 },
  { dueAt: "2026-09-01", planHorizon: "y", completedCount: 0, targetCount: 1 },
  { dueAt: "2026-08-14", planHorizon: "y", planPinned: true, completedCount: 0, targetCount: 1 },
], today);
assert.equal(liveGroups.find((g) => g.id === "w").count, 1);
assert.equal(liveGroups.find((g) => g.id === "m").count, 1);
assert.equal(liveGroups.find((g) => g.id === "y").count, 1);
assert.equal(liveGroups.find((g) => g.id === "q").count, 0);

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

// ── Daily pace: 30 tasks by the 25th from the 17th → 9 days, 4 today ────────
const paceDay = new Date("2026-08-17T12:00:00");
const pace = deriveDailyTaskPace({
  targetCount: 30,
  dueAt: "2026-08-25",
  startAt: "2026-08-17",
  today: paceDay,
});
assert.equal(pace.active, true);
assert.equal(pace.days, 9);
assert.equal(pace.even, 3);
assert.equal(pace.extra, 3);
assert.equal(pace.todayExpected, 4);

const lastDay = deriveDailyTaskPace({
  targetCount: 30,
  dueAt: "2026-08-25",
  startAt: "2026-08-17",
  today: new Date("2026-08-25T12:00:00"),
});
assert.equal(lastDay.todayExpected, 3);

const sameDay = deriveDailyTaskPace({
  targetCount: 30,
  dueAt: "2026-08-17",
  startAt: "2026-08-17",
  today: paceDay,
});
assert.equal(sameDay.days, 1);
assert.equal(sameDay.todayExpected, 30);

assert.equal(deriveDailyTaskPace({ targetCount: 1, dueAt: "2026-08-25", today: paceDay }).active, false);
assert.equal(deriveDailyTaskPace({
  targetCount: 30,
  completedCount: 30,
  dueAt: "2026-08-25",
  startAt: "2026-08-17",
  today: paceDay,
}).todayExpected, 0);

const board = deriveBoardDailyPace([
  { targetCount: 30, completedCount: 0, dueAt: "2026-08-25", createdAt: "2026-08-17", status: "active" },
  { targetCount: 1, dueAt: "2026-08-25", status: "active" },
], paceDay);
assert.equal(board.active, 1);
assert.equal(board.todayExpected, 4);
assert.ok(dailyPaceLabel(pace, true).includes("4"));

// ── Certification gate — names the missing certificate in all assign modes ───
const people = [
  { employeeId: "e1", name: "Lapsed", certificates: [{ code: "loto", expiryDate: "2020-01-01", status: "expired" }] },
  { employeeId: "e2", name: "Valid", certificates: [{ code: "loto", expiryDate: "2027-01-01", status: "approved" }] },
  { employeeId: "e3", name: "NoFa", certificates: [{ code: "loto", expiryDate: "2027-01-01", status: "approved" }] },
];

const oneInCompany = checkAssignGate({
  workKind: "pm",
  assignMode: "one",
  ownerId: "e1",
  people,
  lang: "en",
  today,
});
assert.equal(oneInCompany.ok, true);
assert.equal(oneInCompany.required, "loto");
assert.equal(oneInCompany.certLabel, CERT_LABELS.loto.en);

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

const someOk = checkAssignGate({
  workKind: "pm",
  assignMode: "some",
  memberIds: ["e1", "e2"],
  people,
  lang: "ar",
  today,
});
assert.equal(someOk.ok, true);

const allOk = checkAssignGate({
  workKind: "pm",
  assignMode: "all",
  stationId: "st1",
  people: [people[0], people[1]],
  lang: "en",
  today,
});
assert.equal(allOk.ok, true);

const emGate = checkAssignGate({
  workKind: "em",
  assignMode: "one",
  ownerId: "e3",
  people,
  lang: "en",
  today,
});
assert.equal(emGate.ok, true);
assert.equal(emGate.required, "fa");

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

// ── Manager-only توكيل keeps the original assignee on the trail ─────────────
const manager = { id: "mgr1", role: "ops_manager" };
const employee = { id: "e1", role: "employee" };
const openTask = { status: "active", ownerId: "e1", assignMode: "one", completedCount: 0, targetCount: 1 };
const doneTask = { status: "completed", ownerId: "e1", assignMode: "one", approvedAt: "2026-08-10" };
const awaitingTask = { status: "awaiting_approval", ownerId: "e1", assignMode: "one", completedCount: 1, targetCount: 1 };
assert.equal(canReassignOpsTask(openTask, manager, {}), true);
assert.equal(canReassignOpsTask(openTask, employee, {}), false);
assert.equal(canReassignOpsTask(doneTask, manager, {}), false);
assert.equal(canReassignOpsTask(awaitingTask, manager, {}), false);

const eastManager = { id: "e0", role: "station_manager", stationId: "east", managedStations: [] };
const childTask = { ...openTask, stationId: "khf" };
const eastTree = {
  stations: [
    { id: "east", parentStationId: "co", managerId: "e0" },
    { id: "khf", parentStationId: "east" },
    { id: "co", isCompanyRoot: true },
  ],
};
assert.equal(canReassignOpsTask(childTask, eastManager, eastTree), true);
assert.equal(canReassignOpsTask({ ...openTask, stationId: "west" }, eastManager, eastTree), false);

const reassignPeople = [{ employeeId: "e1", name: "First" }, { employeeId: "e2", name: "Second" }];
const missingReason = checkReassignGate({
  task: openTask,
  user: manager,
  toId: "e2",
  reason: "",
  people: reassignPeople,
  lang: "ar",
});
assert.equal(missingReason.ok, false);
assert.equal(missingReason.error, "REASON_REQUIRED");

const samePerson = checkReassignGate({
  task: openTask,
  user: manager,
  toId: "e1",
  reason: "لم يُنجز",
  people: reassignPeople,
  lang: "ar",
});
assert.equal(samePerson.ok, false);
assert.equal(samePerson.error, "SELF_REASSIGN_FORBIDDEN");

const okReassign = checkReassignGate({
  task: openTask,
  user: manager,
  toId: "e2",
  reason: "لم يُنجز في الوقت",
  people: reassignPeople,
  lang: "ar",
});
assert.equal(okReassign.ok, true);

const next = applyOpsReassign(openTask, {
  fromId: "e1",
  toId: "e2",
  byId: "mgr1",
  reason: "لم يُنجز في الوقت",
  fromName: "First",
  toName: "Second",
  byName: "Manager",
  at: "2026-08-15T08:00:00.000Z",
  lang: "ar",
});
assert.equal(next.ownerId, "e2");
assert.equal(next.originalOwnerId, "e1");
assert.equal(next.assignmentHistory.length, 1);
assert.equal(next.assignmentHistory[0].fromId, "e1");
assert.equal(next.assignmentHistory[0].toId, "e2");
assert.equal(next.assignmentHistory[0].byId, "mgr1");
assert.match(assignmentHistoryNote(next.assignmentHistory[0], "ar"), /وُكِّل من First إلى Second/);
assert.match(assignmentHistoryNote(next.assignmentHistory[0], "ar"), /لم يُنجز في الوقت/);

console.log("opsDerivations E2E rules: PASS");
