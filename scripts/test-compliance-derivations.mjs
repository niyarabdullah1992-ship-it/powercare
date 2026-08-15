import assert from "node:assert/strict";
import {
  EXPIRY_WARN_DAYS,
  buildWpsFileRows,
  checkComplianceDocGate,
  checkGosiFileGate,
  checkNitaqatHireGate,
  checkWpsFileGate,
  deriveGosiMonthly,
  deriveNitaqat,
} from "../src/lib/complianceDerivations.js";

assert.equal(EXPIRY_WARN_DAYS, 60);

const missing = checkComplianceDocGate({
  employee: { employeeId: "e1", saudi: false, docs: [] },
  today: "2026-08-12",
});
assert.equal(missing.ok, false);
assert.equal(missing.error, "DOC_MISSING");
assert.match(missing.reasonEn, /Iqama|Work permit|GOSI|Qiwa/i);

const expiring = checkComplianceDocGate({
  employee: {
    employeeId: "e2",
    saudi: true,
    nationalId: "1099999999",
    gosiNumber: "G1",
    qiwaTitle: "Operator",
    docs: [{ kind: "national_id", number: "1099999999", expiryDate: "2026-09-01" }],
  },
  today: "2026-08-12",
});
assert.equal(expiring.ok, false);
assert.equal(expiring.error, "DOC_EXPIRING");
assert.ok(expiring.docLabelEn);

const ok = checkComplianceDocGate({
  employee: {
    employeeId: "e3",
    saudi: true,
    nationalId: "1012345678",
    gosiNumber: "G2",
    qiwaTitle: "Tech",
    docs: [{ kind: "national_id", number: "1012345678", expiryDate: "2027-08-01" }],
  },
  today: "2026-08-12",
});
assert.equal(ok.ok, true);

const nitaqat = deriveNitaqat([
  { employeeId: "a", saudi: true },
  { employeeId: "b", saudi: false },
  { employeeId: "c", saudi: false },
  { employeeId: "d", saudi: false },
  { employeeId: "e", saudi: false },
  { employeeId: "f", saudi: false },
  { employeeId: "g", saudi: false },
  { employeeId: "h", saudi: false },
  { employeeId: "i", saudi: false },
  { employeeId: "j", saudi: false },
]);
assert.equal(nitaqat.rate, 10);
assert.equal(nitaqat.band, "low_green");

const hireBlocked = checkNitaqatHireGate({
  nitaqat,
  candidateSaudi: false,
  nitaqatEffectStated: false,
});
assert.equal(hireBlocked.ok, false);
assert.equal(hireBlocked.error, "NITAQAT_EFFECT_REQUIRED");

const gosi = deriveGosiMonthly([
  { employeeId: "e1", base: 4000, allowances: 1000, gosiNumber: "G1" },
]);
assert.ok(gosi.employeeTotal > 0);
assert.ok(gosi.employerTotal > 0);

assert.equal(checkGosiFileGate({ establishmentNumber: "", rows: gosi.rows }).error, "GOSI_ESTABLISHMENT_REQUIRED");
assert.equal(checkGosiFileGate({ establishmentNumber: "500", rows: gosi.rows }).ok, true);

const wpsRows = buildWpsFileRows([
  {
    employeeId: "e1",
    employeeName: "Saud",
    nationalId: "1012345678",
    iban: "SA0380000000608010167519",
    base: 4000,
    allowances: 0,
    qiwaWage: 4000,
    netPay: 3500,
  },
]);
assert.equal(checkWpsFileGate(wpsRows).ok, true);

const badIban = buildWpsFileRows([
  {
    employeeId: "e1",
    nationalId: "1012345678",
    iban: "SA00",
    base: 4000,
    allowances: 0,
    qiwaWage: 4000,
    netPay: 3500,
  },
]);
assert.equal(checkWpsFileGate(badIban).error, "IBAN_INVALID");

const mismatch = buildWpsFileRows([
  {
    employeeId: "e1",
    nationalId: "1012345678",
    iban: "SA0380000000608010167519",
    base: 4000,
    allowances: 0,
    qiwaWage: 3000,
    netPay: 3500,
  },
]);
assert.equal(checkWpsFileGate(mismatch).error, "QIWA_MISMATCH");

console.log("complianceDerivations E2E rules: PASS");
