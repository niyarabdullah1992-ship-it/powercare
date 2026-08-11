import assert from "node:assert/strict";
import {
  DEFAULT_RATE_LIMITS,
  RESPONSE_HOURS_BY_PRIORITY,
  defaultEscalationChain,
  deriveEscalationChain,
  stageCount,
  responseHoursFor,
  slaHoursLeft,
  isSlaBreached,
  enrichComplaint,
  deriveComplaintStats,
  checkRateLimitGate,
  checkFileAnonymousGate,
  checkEscalateGate,
  checkCloseGate,
  applySlaAutoEscalate,
  countFilingsInWindow,
  RATE_WINDOW_MS,
} from "../src/lib/complaintDerivations.js";

assert.equal(DEFAULT_RATE_LIMITS.day, 3);
assert.equal(DEFAULT_RATE_LIMITS.week, 10);
assert.equal(DEFAULT_RATE_LIMITS.month, 30);
assert.equal(RESPONSE_HOURS_BY_PRIORITY.high, 24);
assert.equal(RESPONSE_HOURS_BY_PRIORITY.medium, 48);

const chain = defaultEscalationChain("تركي");
assert.equal(stageCount(chain), 4);
assert.ok(chain[0].labelAr.includes("تركي"));

const manual = deriveEscalationChain(["e1", "e2"], [{ id: "e1", name: "A" }, { id: "e2", name: "B" }]);
assert.equal(manual.length, 2);
assert.deepEqual(manual[0].handlerIds, ["e1"]);

const NOW = new Date(2026, 7, 11, 12, 0, 0).getTime();

const openHigh = {
  id: "r1",
  title: "PPE",
  priority: "high",
  status: "open",
  escalationLevel: 0,
  createdAt: new Date(NOW - 30 * 3600_000).toISOString(), // 30h ago > 24h SLA
  levelSinceAt: new Date(NOW - 30 * 3600_000).toISOString(),
};
assert.equal(responseHoursFor(openHigh), 24);
assert.ok(slaHoursLeft(openHigh, NOW) < 0);
assert.equal(isSlaBreached(openHigh, NOW), true);

const fresh = {
  ...openHigh,
  levelSinceAt: new Date(NOW - 2 * 3600_000).toISOString(),
};
assert.equal(isSlaBreached(fresh, NOW), false);

assert.equal(checkRateLimitGate({ day: 3, week: 0, month: 0 }).error, "RATE_LIMIT_DAY");
assert.equal(checkRateLimitGate({ day: 0, week: 10, month: 0 }).error, "RATE_LIMIT_WEEK");
assert.equal(checkRateLimitGate({ day: 0, week: 0, month: 30 }).error, "RATE_LIMIT_MONTH");
assert.equal(checkRateLimitGate({ day: 2, week: 9, month: 29 }).ok, true);

assert.equal(checkFileAnonymousGate({ message: "", usage: { day: 0, week: 0, month: 0 } }).error, "MESSAGE_REQUIRED");
assert.equal(
  checkFileAnonymousGate({ message: "x", usage: { day: 3, week: 0, month: 0 } }).error,
  "RATE_LIMIT_DAY",
);
assert.equal(
  checkFileAnonymousGate({ message: "hello", usage: { day: 0, week: 0, month: 0 } }).ok,
  true,
);

assert.equal(checkEscalateGate(null, chain).error, "REPORT_NOT_FOUND");
assert.equal(checkEscalateGate({ ...openHigh, status: "closed" }, chain).error, "ALREADY_CLOSED");
assert.equal(
  checkEscalateGate({ ...openHigh, escalationLevel: 3 }, chain).error,
  "AT_TOP_OF_CHAIN",
);
assert.equal(
  checkEscalateGate(openHigh, chain, { isHandler: false }).error,
  "NOT_HANDLER",
);
assert.equal(checkEscalateGate(openHigh, chain, { isHandler: true }).ok, true);
assert.equal(checkEscalateGate(openHigh, chain, { forceSla: true }).reason, "SLA_BREACH");

const emptyNext = deriveEscalationChain(["e1", "e2"], [{ id: "e1", name: "A" }]);
// e2 has no employee — still has handlerIds [e2]
assert.equal(checkEscalateGate(openHigh, emptyNext, { isHandler: true }).ok, true);
const bareNext = [
  { id: "e1", labelAr: "A", labelEn: "A", handlerIds: ["e1"] },
  { id: "orphan", labelAr: "?", labelEn: "?", handlerIds: [] },
];
assert.equal(
  checkEscalateGate(openHigh, bareNext, { isHandler: true }).error,
  "NO_HANDLER_AT_LEVEL",
);
// SLA sweep may still climb even without named next handler on custom tiers? forceSla bypasses NO_HANDLER
assert.equal(checkEscalateGate(openHigh, bareNext, { forceSla: true }).ok, true);

assert.equal(checkCloseGate(null).error, "REPORT_NOT_FOUND");
assert.equal(checkCloseGate({ ...openHigh, status: "closed" }).error, "ALREADY_CLOSED");
assert.equal(checkCloseGate(openHigh, { isHandler: false }).error, "NOT_HANDLER");
assert.equal(checkCloseGate(openHigh, { isHandler: true }).ok, true);

const swept = applySlaAutoEscalate([openHigh, fresh], chain, NOW);
assert.equal(swept.escalated, 1);
assert.equal(swept.reports[0].escalationLevel, 1);
assert.equal(swept.reports[0].lastEscalationReason, "SLA_BREACH");
assert.equal(swept.reports[1].escalationLevel, 0);

const enriched = enrichComplaint(openHigh, chain, NOW);
assert.equal(enriched.slaBreached, true);
assert.equal(enriched.steps[0].state, "current");
assert.equal(enriched.anonymous, true); // no reporterName

const named = enrichComplaint({
  ...fresh,
  reporterName: "خالد",
  kind: "safety",
  anonymous: false,
}, chain, NOW);
assert.equal(named.anonymous, false);
assert.equal(named.kind, "safety");

const stats = deriveComplaintStats([
  openHigh,
  fresh,
  {
    id: "c1",
    title: "closed",
    status: "closed",
    priority: "medium",
    createdAt: new Date(NOW - 20 * 3600_000).toISOString(),
    closedAt: new Date(NOW - 10 * 3600_000).toISOString(),
    satisfaction: 86,
    reporterName: "x",
  },
], chain, NOW);
assert.equal(stats.openCount, 2);
assert.ok(stats.breachedCount >= 1);
assert.equal(stats.closedThisMonth, 1);
assert.equal(stats.avgSatisfaction, 86);

const ats = [
  new Date(NOW - 1 * 3600_000).toISOString(),
  new Date(NOW - 2 * RATE_WINDOW_MS.day).toISOString(),
];
assert.equal(countFilingsInWindow(ats, RATE_WINDOW_MS.day, NOW), 1);

console.log("complaint derivations ok");
