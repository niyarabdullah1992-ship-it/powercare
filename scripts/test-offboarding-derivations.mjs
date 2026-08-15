import assert from "node:assert/strict";
import {
  ANNUAL_ENTITLEMENT_DAYS,
  serviceYears,
  isPreStart,
  finalWage,
  eosGratuity,
  unusedAnnualDays,
  leaveCashout,
  outstandingCount,
  isOffboardingGateOpen,
  deriveEos,
  enrichOffboardingCase,
  checkMarkReturnedGate,
  checkCompleteOffboardingGate,
} from "../src/lib/offboardingDerivations.js";

assert.equal(ANNUAL_ENTITLEMENT_DAYS, 21);

// Fixed clock: 2026-08-11 — hire 2019-02-03 ≈ 7.51 years
const NOW = new Date(2026, 7, 11).getTime();
const yrs = serviceYears("2019-02-03", NOW);
assert.ok(yrs > 7.4 && yrs < 7.6);
assert.equal(isPreStart("2027-01-01", NOW), true);
assert.equal(isPreStart("2019-02-03", NOW), false);

assert.equal(finalWage(9800, 2600), 12400);
// 7.5y @ 12400 → (5*0.5 + 2.5)*12400 = 5*12400 = 62000
assert.equal(eosGratuity(7.5, 12400), 62000);
assert.equal(eosGratuity(3, 10000), 15000); // 3 * 0.5 * 10000
assert.equal(unusedAnnualDays(12), 9);
assert.equal(leaveCashout(12400, 9), Math.round((12400 / 30) * 9));

const assets = [
  { id: "a1", name: "Radio", serial: "RAD-1", status: "outstanding" },
  { id: "a2", name: "Laptop", serial: "LAP-1", status: "returned", returnedAt: "2026-08-01" },
];
assert.equal(outstandingCount(assets), 1);
assert.equal(isOffboardingGateOpen(assets), false);
assert.equal(isOffboardingGateOpen([{ ...assets[0], status: "returned" }, assets[1]]), true);

const caseRow = {
  employeeId: "e1",
  hireDate: "2019-02-03",
  base: 9800,
  allowances: 2600,
  annualLeaveUsed: 12,
  status: "in_progress",
  safetyCleared: true,
  assets: [
    { id: "a1", name: "Radio", serial: "RAD-2291", status: "outstanding" },
    { id: "a2", name: "Laptop", serial: "LAP-0847", status: "outstanding" },
    { id: "a3", name: "Badge", serial: "BDG-1042", status: "outstanding" },
    { id: "a4", name: "PPE", serial: "PPE-3310", status: "outstanding" },
  ],
};

assert.equal(checkMarkReturnedGate(null, "a1").error, "CASE_NOT_FOUND");
assert.equal(checkMarkReturnedGate(caseRow, "missing").error, "ASSET_NOT_FOUND");
assert.equal(checkMarkReturnedGate(caseRow, "a1").ok, true);
assert.equal(
  checkMarkReturnedGate(
    { ...caseRow, assets: caseRow.assets.map((a) => (a.id === "a1" ? { ...a, status: "returned" } : a)) },
    "a1",
  ).error,
  "ALREADY_RETURNED",
);

assert.equal(checkCompleteOffboardingGate(caseRow).error, "ASSETS_OUTSTANDING");
assert.equal(checkCompleteOffboardingGate({ ...caseRow, assets: [] }).error, "NO_ASSETS");
assert.equal(
  checkCompleteOffboardingGate({
    ...caseRow,
    assets: caseRow.assets.map((a) => ({ ...a, status: "returned", returnedAt: "2026-08-10" })),
  }).ok,
  true,
);
assert.equal(
  checkCompleteOffboardingGate({ ...caseRow, status: "completed" }).error,
  "ALREADY_COMPLETED",
);

const blocked = enrichOffboardingCase(caseRow, NOW);
assert.equal(blocked.outstandingCount, 4);
assert.equal(blocked.gateOpen, false);
assert.equal(blocked.steps.find((s) => s.id === "assets").state, "blocked");
assert.equal(blocked.steps.find((s) => s.id === "access").state, "on_completion");

const eos = deriveEos(caseRow, NOW);
assert.equal(eos.wage, 12400);
assert.equal(eos.unusedAnnualDays, 9);
assert.ok(eos.total > eos.gratuity);
assert.equal(eos.preStart, false);

const pre = deriveEos({ ...caseRow, hireDate: "2027-01-01" }, NOW);
assert.equal(pre.preStart, true);
assert.equal(pre.total, 0);

const open = enrichOffboardingCase({
  ...caseRow,
  assets: caseRow.assets.map((a) => ({ ...a, status: "returned", returnedAt: "2026-08-10" })),
}, NOW);
assert.equal(open.gateOpen, true);
assert.equal(open.steps.find((s) => s.id === "assets").state, "done");

console.log("offboarding derivations ok");
