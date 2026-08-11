import assert from "node:assert/strict";
import {
  sealIdFor,
  deriveProofStage,
  deriveProofCounts,
  checkApproveWorkProofGate,
  checkAcceptGate,
} from "../src/lib/workProofDerivations.js";

const base = {
  ref: "WP-4821",
  beforeStamp: "06:18",
  afterStamp: "09:42",
  geoVerdict: "in",
  raiserId: "tech1",
  status: "ready",
};

assert.equal(sealIdFor(base), sealIdFor({ ...base }));
assert.notEqual(sealIdFor(base), sealIdFor({ ...base, afterStamp: "10:00" }));
assert.notEqual(sealIdFor(base), sealIdFor({ ...base, geoVerdict: "out" }));

assert.equal(deriveProofStage({ ...base, afterStamp: null }), "await");
assert.equal(deriveProofStage(base), "ready");
assert.equal(deriveProofStage({ ...base, sealId: sealIdFor(base), status: "sealed" }), "sealed");

const self = checkApproveWorkProofGate({ proof: base, actorUserId: "tech1" });
assert.equal(self.ok, false);
assert.equal(self.error, "SELF_APPROVE_FORBIDDEN");

const ok = checkApproveWorkProofGate({ proof: base, actorUserId: "mgr1" });
assert.equal(ok.ok, true);

const geo = checkApproveWorkProofGate({
  proof: { ...base, geoVerdict: "out", geoCleared: false },
  actorUserId: "mgr1",
});
assert.equal(geo.error, "GEO_CLEARANCE_REQUIRED");

const geoOk = checkApproveWorkProofGate({
  proof: { ...base, geoVerdict: "out", geoCleared: false },
  actorUserId: "mgr1",
  geoClearReason: "accepted with escort",
});
assert.equal(geoOk.ok, true);

const sealed = { ...base, status: "sealed", sealId: sealIdFor(base) };
assert.equal(checkAcceptGate(sealed).ok, true);
assert.equal(checkAcceptGate({ ...sealed, afterStamp: "changed" }).error, "SEAL_INVALID");

const counts = deriveProofCounts([base, { ...base, ref: "WP-2", afterStamp: null }, sealed]);
assert.equal(counts.ready, 1);
assert.equal(counts.await, 1);
assert.equal(counts.sealed, 1);

console.log("workProof derivations: PASS");
