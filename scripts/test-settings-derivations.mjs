import assert from "node:assert/strict";
import {
  DEFAULT_RADIUS_METERS,
  DEFAULT_RATE_LIMITS,
  checkCompanyRecordGate,
  checkGeofenceConfigGate,
  checkLocationAgainstGeofence,
  deriveCompanyRows,
  deriveVerificationMode,
  distanceMeters,
  enrichGeofenceRow,
  exposeAnonymousRateLimits,
  normalizeCompanyRecord,
  normalizeEmailDomain,
} from "../src/lib/settingsDerivations.js";

assert.equal(DEFAULT_RATE_LIMITS.day, 3);
assert.equal(DEFAULT_RATE_LIMITS.week, 10);
assert.equal(DEFAULT_RATE_LIMITS.month, 30);
assert.equal(DEFAULT_RADIUS_METERS, 200);

assert.equal(normalizeEmailDomain("gulfops.sa"), "@gulfops.sa");
assert.equal(normalizeEmailDomain("@GulfOps.SA"), "@gulfops.sa");

const good = checkCompanyRecordGate({
  commercialRegistration: "1010472819",
  vatNumber: "310472819300003",
  qiwaEstablishment: "7-1104829",
  allowedEmailDomain: "@gulfops.sa",
});
assert.equal(good.ok, true);
assert.equal(good.record.allowedEmailDomain, "@gulfops.sa");

assert.equal(checkCompanyRecordGate({ commercialRegistration: "123" }).error, "INVALID_CR");
assert.equal(checkCompanyRecordGate({ vatNumber: "123456789012345" }).error, "INVALID_VAT");
assert.equal(checkCompanyRecordGate({ qiwaEstablishment: "bad" }).error, "INVALID_QIWA_ESTABLISHMENT");
assert.equal(checkCompanyRecordGate({ allowedEmailDomain: "not a domain" }).error, "INVALID_EMAIL_DOMAIN");

assert.equal(checkGeofenceConfigGate({ lat: 27.01, lng: 49.62, radiusMeters: 220 }).ok, true);
assert.equal(checkGeofenceConfigGate({ lat: 200, lng: 49 }).error, "INVALID_COORDS");
assert.equal(checkGeofenceConfigGate({ lat: 27, lng: 49, radiusMeters: 10 }).error, "INVALID_RADIUS");
assert.equal(checkGeofenceConfigGate({ lat: null, lng: 49 }).error, "INVALID_COORDS");

const station = { stationId: "jbl1", name: "Jubail 1", lat: 27.0174, lng: 49.6225, radiusMeters: 220 };
const inside = checkLocationAgainstGeofence({
  geofenceVerificationRequired: true,
  station,
  lat: 27.0175,
  lng: 49.6226,
});
assert.equal(inside.ok, true);
assert.equal(inside.verdict, "inside");
assert.equal(inside.checkInIsProof, true);
assert.equal(inside.discardedCoords, true);

const outside = checkLocationAgainstGeofence({
  geofenceVerificationRequired: true,
  station,
  lat: 27.05,
  lng: 49.70,
});
assert.equal(outside.ok, false);
assert.equal(outside.error, "OUTSIDE_GEOFENCE");
assert.equal(outside.verdict, "outside");

const missing = checkLocationAgainstGeofence({
  geofenceVerificationRequired: true,
  station,
  lat: null,
  lng: null,
});
assert.equal(missing.error, "GEOFENCE_REQUIRED");

const badCoords = checkLocationAgainstGeofence({
  geofenceVerificationRequired: true,
  station,
  lat: 999,
  lng: 0,
});
assert.equal(badCoords.error, "INVALID_COORDS");

const unconfigured = checkLocationAgainstGeofence({
  geofenceVerificationRequired: true,
  station: { stationId: "x", lat: null, lng: null },
  lat: 27,
  lng: 49,
});
assert.equal(unconfigured.error, "GEOFENCE_NOT_CONFIGURED");

const off = checkLocationAgainstGeofence({
  geofenceVerificationRequired: false,
  station,
  lat: null,
  lng: null,
});
assert.equal(off.ok, true);
assert.equal(off.verdict, "self_declaration");
assert.equal(off.checkInIsProof, false);
assert.equal(off.verificationMode, "self_declaration");

const modeOn = deriveVerificationMode(true);
assert.equal(modeOn.verificationMode, "geofence_proof");
assert.equal(modeOn.checkInIsProof, true);
assert.ok(modeOn.wordingEn.includes("geofence"));

const modeOff = deriveVerificationMode(false);
assert.equal(modeOff.verificationMode, "self_declaration");
assert.equal(modeOff.checkInIsProof, false);
assert.ok(modeOff.wordingEn.toLowerCase().includes("self-declaration"));

const row = enrichGeofenceRow(station);
assert.equal(row.configured, true);
assert.ok(row.coordsLabel.includes("27.0174"));
assert.equal(row.radiusMeters, 220);

const awaiting = enrichGeofenceRow({ stationId: "x", name: "X" });
assert.equal(awaiting.configured, false);
assert.equal(awaiting.coordsLabel, "");

const rows = deriveCompanyRows(normalizeCompanyRecord({
  name: "Gulf",
  commercialRegistration: "1010472819",
  activeUsers: 142,
  seatLimit: 200,
}), "en");
assert.equal(rows.find((r) => r.key === "users").value, "142 of 200");

const limits = exposeAnonymousRateLimits(null);
assert.deepEqual(limits.map((l) => l.value), [3, 10, 30]);

const near = distanceMeters(27.0174, 49.6225, 27.0175, 49.6226);
assert.ok(near < 50);

console.log("settings derivations: ok");
