import assert from "node:assert/strict";
import {
  RQ_STAGES,
  cumulativeSlaDays,
  stageDueDate,
  deriveVacancyBoard,
  checkAdvanceGate,
  checkRejectGate,
  checkConfirmStartGate,
  applicableHireSteps,
  deriveHiringStats,
} from "../src/lib/hiringDerivations.js";

assert.equal(RQ_STAGES.length, 5);
assert.equal(cumulativeSlaDays(0), 3);
assert.equal(cumulativeSlaDays(1), 8); // 3+5 from open day — not stage entry
assert.equal(cumulativeSlaDays(4), 3 + 5 + 7 + 7 + 5);

assert.equal(stageDueDate("2026-08-01", 0), "2026-08-04");
assert.equal(stageDueDate("2026-08-01", 1), "2026-08-09");

const now = new Date(2026, 7, 11); // 2026-08-11
const lateVac = {
  key: "r1",
  title: "Ops",
  stationId: "s1",
  opened: "2026-07-14",
  at: 4,
  nitaqatEffectStated: true,
  chosen: { name: "Lama" },
};
const board = deriveVacancyBoard(lateVac, now);
assert.equal(board.late, true); // open Jul 14 + 27 SLA days = Aug 10; now Aug 11
assert.equal(board.canAdvance, true);

const fresh = { key: "r4", title: "Mech", stationId: "s1", opened: "2026-08-09", at: 0 };
assert.equal(checkAdvanceGate(fresh).error, "NITAQAT_EFFECT_REQUIRED");
assert.equal(checkAdvanceGate({ ...fresh, nitaqatEffectStated: true }).ok, true);

const offerNoPick = {
  key: "r1",
  opened: "2026-07-14",
  at: 4,
  nitaqatEffectStated: true,
  chosen: null,
};
assert.equal(checkAdvanceGate(offerNoPick).error, "OFFER_PICK_REQUIRED");
assert.equal(checkAdvanceGate({ ...offerNoPick, chosen: { name: "Lama" } }).ok, true);

assert.equal(checkRejectGate("").error, "REJECT_REASON_REQUIRED");
assert.equal(checkRejectGate("Below experience").ok, true);

assert.equal(applicableHireSteps(true).some((s) => s.id === "iqama"), false);
assert.equal(applicableHireSteps(false).some((s) => s.id === "iqama"), true);

const hireBlocked = { key: "h1", saudi: true, stepsDone: { offer: true }, confirmed: false };
assert.equal(checkConfirmStartGate(hireBlocked).error, "MANDATORY_STEPS_OPEN");

const hireReady = {
  key: "h1",
  saudi: true,
  stepsDone: { offer: true, qiwa: true, gosi: true, med: true, hse: true },
  confirmed: false,
};
assert.equal(checkConfirmStartGate(hireReady).ok, true);

const stats = deriveHiringStats(
  [{ key: "r1", opened: "2026-08-01", at: 0, count: 2 }, { key: "r2", opened: "2026-08-01", at: 5, withdrawn: false }],
  [{ id: "a1", vacancyKey: "r1" }, { id: "a2", vacancyKey: "r2" }],
  now,
);
assert.equal(stats.vacanciesOpen, 2);
assert.equal(stats.applications, 1);

console.log("hiring derivations ok");
