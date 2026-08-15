import assert from "node:assert/strict";
import {
  SCOPE,
  ORG_SECTIONS,
  BASELINE_MATRIX,
  nextScopeInCycle,
  checkSetPermGate,
  checkCreateBranchGate,
  checkReparentGate,
  checkCreateDelegationGate,
  derivePermissionMatrix,
  deriveEscalationFromBranches,
  isDelegationActive,
  deriveDelegationStatus,
  wouldCreateCycle,
} from "../src/lib/orgDerivations.js";

assert.equal(ORG_SECTIONS.length, 22);
assert.equal(BASELINE_MATRIX.length, 22);
assert.equal(ORG_SECTIONS[10], "work_proof");
assert.equal(BASELINE_MATRIX[7][1], SCOPE.NONE); // HR × station mgr — grantable
assert.equal(BASELINE_MATRIX[9][0], SCOPE.COMPANY); // settings × ops director
assert.equal(BASELINE_MATRIX[9][4], SCOPE.NONE);

assert.equal(nextScopeInCycle(SCOPE.OWN), SCOPE.STATION);
assert.equal(nextScopeInCycle(SCOPE.COMPANY), SCOPE.NONE);
assert.equal(nextScopeInCycle(SCOPE.DELEGATED), SCOPE.OWN);

assert.equal(checkSetPermGate(SCOPE.DELEGATED).error, "DELEGATED_IS_DERIVED");
assert.equal(checkSetPermGate(SCOPE.STATION).ok, true);

assert.equal(checkCreateBranchGate({ name: "", managerId: "e1" }).error, "BRANCH_NAME_REQUIRED");
assert.equal(checkCreateBranchGate({ name: "Khafji", managerId: "" }).error, "BRANCH_MANAGER_REQUIRED");
assert.equal(checkCreateBranchGate({ name: "Khafji", managerId: "e1" }).ok, true);

const nodes = [
  { id: "a", parentId: null },
  { id: "b", parentId: "a" },
  { id: "c", parentId: "b" },
];
assert.equal(wouldCreateCycle(nodes, "a", "c"), true);
assert.equal(wouldCreateCycle(nodes, "c", "a"), false);
assert.equal(checkReparentGate(nodes, "a", "c").error, "CYCLE_FORBIDDEN");
assert.equal(checkReparentGate(nodes, "c", "a").ok, true);

const now = new Date(2026, 7, 11);
assert.equal(isDelegationActive({ id: "d1", fromId: "a", toId: "b", perm: "x", end: "2026-08-18" }, now), true);
assert.equal(isDelegationActive({ id: "d2", fromId: "a", toId: "b", perm: "x", end: "2026-08-09" }, now), false);
assert.equal(deriveDelegationStatus({ id: "d2", fromId: "a", toId: "b", perm: "x", end: "2026-08-09" }, now).status, "expired");

assert.equal(checkCreateDelegationGate({ fromId: "a", toId: "a", end: "2026-09-01", perm: "tasks" }).error, "SELF_DELEGATION_FORBIDDEN");
assert.equal(checkCreateDelegationGate({ fromId: "a", toId: "b", end: "2026-09-01", perm: "tasks" }).ok, true);

const matrix = derivePermissionMatrix({});
assert.equal(matrix[7].cells[1].derived, false);
assert.equal(matrix[7].cells[1].scope, SCOPE.NONE);
assert.equal(matrix[0].cells[0].scope, SCOPE.COMPANY);

const dirty = derivePermissionMatrix({ "0:4": SCOPE.STATION });
assert.equal(dirty[0].cells[4].overridden, true);
assert.equal(dirty[0].cells[4].scope, SCOPE.STATION);

const esc = deriveEscalationFromBranches([
  { id: "jbl1", name: "Jubail 1", managerId: "m1", managerName: "Saud" },
  { id: "x", name: "Empty" },
]);
assert.equal(esc.length, 1);
assert.equal(esc[0].managerId, "m1");

console.log("org derivations ok");
