import assert from "node:assert/strict";
import {
  CALIBRATION_BAND,
  DEFAULT_OBJECTIVES,
  checkCreateCycleGate,
  checkCreateJobGate,
  checkCreateOrgUnitGate,
  checkCreatePositionGate,
  checkCycleTransitionGate,
  checkEmploymentActionGate,
  checkGoalPlanGate,
  checkManagerRatingGate,
  deriveCostCenter,
  deriveEmployeeAssignment,
  deriveEmployeeTaskFacts,
  deriveGoalAttainment,
  deriveObjectiveBoard,
  deriveOrgUnitRollup,
  derivePositionBoard,
  objectiveWeightTotal,
  replayEmployeeActions,
} from "../src/lib/hcmDerivations.js";

/* ── org units ── */
const units = [
  { id: "u1", name: "الشركة", type: "company", parentId: null, costCenter: "CC-100", establishmentNumber: "1234567", effectiveFrom: "2026-01-01" },
  { id: "u2", name: "التشغيل", type: "division", parentId: "u1", effectiveFrom: "2026-01-01" },
  { id: "u3", name: "محطة جبيل", type: "station", parentId: "u2", stationId: "st1", effectiveFrom: "2026-01-01" },
];

assert.equal(checkCreateOrgUnitGate({ name: "", type: "department", effectiveFrom: "2026-01-01", units }).error, "ORG_UNIT_NAME_REQUIRED");
assert.equal(checkCreateOrgUnitGate({ name: "الصيانة", type: "widget", effectiveFrom: "2026-01-01", units }).error, "ORG_UNIT_TYPE_INVALID");
assert.equal(checkCreateOrgUnitGate({ name: "الصيانة", type: "department", parentId: "ghost", effectiveFrom: "2026-01-01", units }).error, "ORG_UNIT_PARENT_NOT_FOUND");
assert.equal(checkCreateOrgUnitGate({ name: "الصيانة", type: "department", parentId: "u1", units }).error, "EFFECTIVE_DATE_REQUIRED");
assert.equal(checkCreateOrgUnitGate({ id: "u1", name: "الشركة", type: "company", parentId: "u3", effectiveFrom: "2026-01-01", units }).error, "ORG_UNIT_CYCLE_FORBIDDEN");
assert.equal(checkCreateOrgUnitGate({ name: "الصيانة", type: "department", parentId: "u1", effectiveFrom: "2026-01-01", establishmentNumber: "12", units }).error, "ESTABLISHMENT_NUMBER_INVALID");
assert.equal(checkCreateOrgUnitGate({ name: "الصيانة", type: "department", parentId: "u1", effectiveFrom: "2026-01-01", units }).ok, true);

// cost centre is inherited from the nearest ancestor that declares one
assert.equal(deriveCostCenter(units, "u3").costCenter, "CC-100");
assert.equal(deriveCostCenter(units, "u3").inherited, true);

/* ── jobs ── */
const jobs = [{ id: "j1", code: "OPS-TECH", title: "فني تشغيل", family: "operations" }];
assert.equal(checkCreateJobGate({ code: "", title: "x", family: "operations", jobs }).error, "JOB_CODE_REQUIRED");
assert.equal(checkCreateJobGate({ code: "ops-tech", title: "x", family: "operations", jobs }).error, "JOB_CODE_DUPLICATE");
assert.equal(checkCreateJobGate({ code: "HSE-01", title: "", family: "hse", jobs }).error, "JOB_TITLE_REQUIRED");
assert.equal(checkCreateJobGate({ code: "HSE-01", title: "مراقب سلامة", family: "space", jobs }).error, "JOB_FAMILY_INVALID");
assert.equal(checkCreateJobGate({ code: "HSE-01", title: "مراقب سلامة", family: "hse", gradeMin: 5, gradeMax: 2, jobs }).error, "JOB_GRADE_BAND_INVALID");
assert.equal(checkCreateJobGate({ code: "HSE-01", title: "مراقب سلامة", family: "hse", jobs }).ok, true);

/* ── positions ── */
const positions = [
  { id: "p1", ref: "POS-1001", jobId: "j1", orgUnitId: "u3", stationId: "st1", fte: 1, effectiveFrom: "2026-01-01" },
  { id: "p2", ref: "POS-1002", jobId: "j1", orgUnitId: "u3", stationId: "st1", fte: 1, effectiveFrom: "2026-01-01" },
];
assert.equal(checkCreatePositionGate({ jobId: "ghost", orgUnitId: "u3", effectiveFrom: "2026-01-01", jobs, units, positions }).error, "POSITION_JOB_NOT_FOUND");
assert.equal(checkCreatePositionGate({ jobId: "j1", orgUnitId: "ghost", effectiveFrom: "2026-01-01", jobs, units, positions }).error, "POSITION_ORG_UNIT_NOT_FOUND");
assert.equal(checkCreatePositionGate({ jobId: "j1", orgUnitId: "u3", fte: 3, effectiveFrom: "2026-01-01", jobs, units, positions }).error, "POSITION_FTE_INVALID");
assert.equal(checkCreatePositionGate({ jobId: "j1", orgUnitId: "u3", effectiveFrom: "", jobs, units, positions }).error, "EFFECTIVE_DATE_REQUIRED");
assert.equal(checkCreatePositionGate({ jobId: "j1", orgUnitId: "u3", fte: 0.5, effectiveFrom: "2026-02-01", jobs, units, positions }).ok, true);

/* ── employment actions ── */
const employeeIds = ["e1", "e2"];
let actions = [];

// no action before hire
assert.equal(
  checkEmploymentActionGate({ type: "transfer", employeeId: "e1", positionId: "p1", effectiveDate: "2026-03-01", reasonCode: "operational_need", actorId: "boss", history: actions, positions, employeeIds }).error,
  "HIRE_ACTION_MISSING",
);
// segregation of duties
assert.equal(
  checkEmploymentActionGate({ type: "hire", employeeId: "e1", positionId: "p1", effectiveDate: "2026-02-01", reasonCode: "new_position", actorId: "e1", history: actions, positions, employeeIds }).error,
  "SELF_ACTION_FORBIDDEN",
);
// coded reason is mandatory and typed
assert.equal(
  checkEmploymentActionGate({ type: "hire", employeeId: "e1", positionId: "p1", effectiveDate: "2026-02-01", reasonCode: "", actorId: "boss", history: actions, positions, employeeIds }).error,
  "ACTION_REASON_REQUIRED",
);
assert.equal(
  checkEmploymentActionGate({ type: "hire", employeeId: "e1", positionId: "p1", effectiveDate: "2026-02-01", reasonCode: "resignation", actorId: "boss", history: actions, positions, employeeIds }).error,
  "ACTION_REASON_INVALID",
);
const hireGate = checkEmploymentActionGate({ type: "hire", employeeId: "e1", positionId: "p1", effectiveDate: "2026-02-01", reasonCode: "new_position", actorId: "boss", history: actions, positions, employeeIds });
assert.equal(hireGate.ok, true);
actions = [...actions, { id: "a1", employeeId: "e1", type: "hire", positionId: "p1", effectiveDate: "2026-02-01", reasonCode: "new_position", recordedAt: "2026-02-01T08:00:00Z" }];

// one seat, one holder
assert.equal(
  checkEmploymentActionGate({ type: "hire", employeeId: "e2", positionId: "p1", effectiveDate: "2026-03-01", reasonCode: "replacement", actorId: "boss", history: actions, positions, employeeIds }).error,
  "POSITION_ALREADY_FILLED",
);
// backdating before the hire date is refused
assert.equal(
  checkEmploymentActionGate({ type: "promotion", employeeId: "e1", positionId: "p2", effectiveDate: "2026-01-05", reasonCode: "performance", actorId: "boss", history: actions, positions, employeeIds }).error,
  "ACTION_BEFORE_HIRE",
);
// duplicate same type + same day
assert.equal(
  checkEmploymentActionGate({ type: "hire", employeeId: "e1", positionId: "p1", effectiveDate: "2026-02-01", reasonCode: "new_position", actorId: "boss", history: actions, positions, employeeIds }).error,
  "ALREADY_HIRED",
);

actions = [
  ...actions,
  { id: "a2", employeeId: "e1", type: "promotion", positionId: "p2", effectiveDate: "2026-06-01", reasonCode: "performance", recordedAt: "2026-06-01T08:00:00Z" },
];
assert.equal(replayEmployeeActions(actions, "e1", "2026-03-01").positionId, "p1");
assert.equal(replayEmployeeActions(actions, "e1", "2026-07-01").positionId, "p2");
assert.equal(replayEmployeeActions(actions, "e1", "2026-01-01").status, "not_hired");

actions = [...actions, { id: "a3", employeeId: "e1", type: "termination", effectiveDate: "2026-09-01", reasonCode: "resignation", recordedAt: "2026-09-01T08:00:00Z" }];
assert.equal(replayEmployeeActions(actions, "e1", "2026-09-02").status, "terminated");
assert.equal(replayEmployeeActions(actions, "e1", "2026-09-02").positionId, null);
assert.equal(
  checkEmploymentActionGate({ type: "transfer", employeeId: "e1", positionId: "p1", effectiveDate: "2026-10-01", reasonCode: "operational_need", actorId: "boss", history: actions, positions, employeeIds }).error,
  "EMPLOYMENT_ENDED",
);

/* ── derived views ── */
const employees = [
  { employeeId: "e1", name: "سعود", stationId: "st1", role: "technician" },
  { employeeId: "e2", name: "خالد", stationId: "st1", role: "technician" },
];
const board = derivePositionBoard({ positions, jobs, units, actions, employees, onDay: "2026-07-01" });
assert.equal(board.find((p) => p.id === "p2").holderId, "e1");
assert.equal(board.find((p) => p.id === "p1").vacant, true);
assert.equal(board.find((p) => p.id === "p2").costCenter, "CC-100");

const rollup = deriveOrgUnitRollup({ units, positions, actions, employees, onDay: "2026-07-01" });
assert.equal(rollup.find((u) => u.id === "u1").positions, 2);
assert.equal(rollup.find((u) => u.id === "u1").filled, 1);
assert.equal(rollup.find((u) => u.id === "u1").vacant, 1);

const assigned = deriveEmployeeAssignment({ employee: employees[0], actions, positions, jobs, units, onDay: "2026-07-01" });
assert.equal(assigned.source, "action");
assert.equal(assigned.positionRef, "POS-1002");
assert.equal(assigned.jobCode, "OPS-TECH");
assert.equal(assigned.gap, null);

// existing data without a register still renders — labelled derived, with a named gap
const underived = deriveEmployeeAssignment({ employee: employees[1], actions, positions, jobs, units, onDay: "2026-07-01" });
assert.equal(underived.source, "derived");
assert.equal(underived.gap.error, "NO_POSITION_ASSIGNMENT");
assert.equal(underived.orgUnitName, "محطة جبيل");

/* ── goal plans keep task weight dominant ── */
assert.equal(objectiveWeightTotal(DEFAULT_OBJECTIVES), 100);
assert.equal(checkGoalPlanGate({ jobId: "j1", objectives: DEFAULT_OBJECTIVES, jobs }).ok, true);
assert.equal(checkGoalPlanGate({ jobId: "ghost", objectives: DEFAULT_OBJECTIVES, jobs }).error, "GOAL_PLAN_JOB_NOT_FOUND");
assert.equal(checkGoalPlanGate({ jobId: "j1", objectives: [], jobs }).error, "GOAL_PLAN_EMPTY");
assert.equal(
  checkGoalPlanGate({ jobId: "j1", objectives: [{ id: "o1", title: "x", source: "task", weight: 60 }], jobs }).error,
  "OBJECTIVE_WEIGHTS_MUST_TOTAL_100",
);
assert.equal(
  checkGoalPlanGate({
    jobId: "j1",
    objectives: [
      { id: "o1", title: "مهام", source: "task", weight: 30 },
      { id: "o2", title: "موعد", source: "ontime", weight: 70 },
    ],
    jobs,
  }).error,
  "TASK_WEIGHT_FLOOR",
);
assert.equal(
  checkGoalPlanGate({ jobId: "j1", objectives: [{ id: "o1", title: "x", source: "morale", weight: 100 }], jobs }).error,
  "OBJECTIVE_SOURCE_INVALID",
);

/* ── task weight → objective attainment ── */
const tasks = [
  { id: "t1", ownerId: "e1", workKind: "pm", priority: "high", effortWeight: 4, approvedAt: "2026-07-02", dueAt: "2026-07-05", status: "completed" }, // 12
  { id: "t2", ownerId: "e1", workKind: "cm", priority: "medium", effortWeight: 3, approvedAt: "2026-07-09", dueAt: "2026-07-06", status: "completed" }, // 6 late
  { id: "t3", ownerId: "e1", workKind: "pm", priority: "low", effortWeight: 2, status: "active", dueAt: "2026-07-20" }, // unproven → no credit
  { id: "t4", ownerId: "e2", workKind: "pm", priority: "medium", effortWeight: 2, approvedAt: "2026-07-04", dueAt: "2026-07-10", status: "completed" }, // 4
];

const facts = deriveEmployeeTaskFacts({ tasks, employeeId: "e1", stationId: "st1" });
assert.equal(facts.points, 18, "only approved task weight counts");
assert.equal(facts.proven, 2);
assert.equal(facts.assigned, 3);
assert.equal(facts.ontimePct, 50);

// a preventive-only objective sees only preventive weight
const pmOnly = deriveGoalAttainment({
  objectives: [
    { id: "o1", title: "وقائية", source: "task", weight: 60, workKinds: ["pm"], targetPoints: 24 },
    { id: "o2", title: "موعد", source: "ontime", weight: 40 },
  ],
  facts,
  peerBenchmark: 18,
});
assert.equal(pmOnly.rows[0].earned, 12);
assert.equal(pmOnly.rows[0].attainmentPct, 50); // 12 of 24
assert.equal(pmOnly.rows[0].targetKind, "absolute");
assert.equal(pmOnly.rows[1].attainmentPct, 50);
assert.equal(pmOnly.score, 50); // 60%·50 + 40%·50

// with no absolute target the peer benchmark is the denominator
const peerBased = deriveGoalAttainment({ objectives: DEFAULT_OBJECTIVES, facts, peerBenchmark: 36, hsePct: 0, coverPct: 0 });
assert.equal(peerBased.rows[0].attainmentPct, 50); // 18 of 36
assert.equal(peerBased.rows[0].targetKind, "peer");
assert.equal(peerBased.score, 38); // 50·0.5 + 50·0.25 + 0 + 0 = 37.5 → 38

const objectiveBoard = deriveObjectiveBoard({
  employees: [
    { employeeId: "e1", name: "سعود", stationId: "st1" },
    { employeeId: "e2", name: "خالد", stationId: "st1" },
  ],
  tasks,
  planFor: () => ({ jobId: "j1", objectives: DEFAULT_OBJECTIVES, custom: false }),
});
assert.equal(objectiveBoard[0].employeeId, "e1");
assert.equal(objectiveBoard[0].rank, 1);
assert.equal(objectiveBoard[0].peerBenchmark, 18);
assert.equal(objectiveBoard[0].objectives[0].attainmentPct, 100);
assert.equal(objectiveBoard[1].objectives[0].attainmentPct, 22); // 4 of 18

/* ── review cycles ── */
const cycles = [{ id: "c1", period: "2026-Q3", from: "2026-07-01", to: "2026-09-30", status: "open" }];
assert.equal(checkCreateCycleGate({ period: "Q3", from: "2026-07-01", to: "2026-09-30", cycles }).error, "CYCLE_PERIOD_INVALID");
assert.equal(checkCreateCycleGate({ period: "2026-Q3", from: "2026-07-01", to: "2026-09-30", cycles }).error, "CYCLE_DUPLICATE");
assert.equal(checkCreateCycleGate({ period: "2026-Q4", from: "2026-08-01", to: "2026-12-31", cycles }).error, "CYCLE_OVERLAP");
assert.equal(checkCreateCycleGate({ period: "2026-Q4", from: "2026-10-01", to: "2026-12-31", cycles }).ok, true);

assert.equal(checkCycleTransitionGate("open", "closed").error, "CYCLE_TRANSITION_FORBIDDEN");
assert.equal(checkCycleTransitionGate("open", "manager_review").ok, true);
assert.equal(checkCycleTransitionGate("manager_review", "closed").ok, true);

const reviewCycle = { id: "c1", period: "2026-Q3", from: "2026-07-01", to: "2026-09-30", status: "manager_review" };
assert.equal(checkManagerRatingGate({ cycle: null, derivedScore: 70, rating: 70 }).error, "CYCLE_NOT_FOUND");
assert.equal(checkManagerRatingGate({ cycle: { ...reviewCycle, status: "open" }, derivedScore: 70, rating: 70 }).error, "CYCLE_NOT_IN_REVIEW");
assert.equal(checkManagerRatingGate({ cycle: reviewCycle, derivedScore: 70, rating: 70, actorId: "m1", employeeId: "m1" }).error, "SELF_RATING_FORBIDDEN");
assert.equal(checkManagerRatingGate({ cycle: reviewCycle, derivedScore: 70, rating: 95, actorId: "m1", employeeId: "e1" }).error, "RATING_OUT_OF_BAND");
assert.equal(checkManagerRatingGate({ cycle: reviewCycle, derivedScore: 70, rating: 76, actorId: "m1", employeeId: "e1", justification: "قصير" }).error, "RATING_JUSTIFICATION_REQUIRED");
assert.equal(checkManagerRatingGate({ cycle: reviewCycle, derivedScore: 70, rating: 70, actorId: "m1", employeeId: "e1" }).ok, true);
assert.equal(
  checkManagerRatingGate({
    cycle: reviewCycle,
    derivedScore: 70,
    rating: 70 + CALIBRATION_BAND,
    actorId: "m1",
    employeeId: "e1",
    justification: "قاد إصلاح عطل حرج خارج الدوام وأغلق ثلاث ملاحظات سلامة موثقة.",
  }).ok,
  true,
);

console.log("hcm derivations ok");
