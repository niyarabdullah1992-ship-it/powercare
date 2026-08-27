import assert from "node:assert/strict";
import { deriveOwnerActions } from "../src/lib/ownerActionCenter.js";

const now = new Date("2026-08-20T09:00:00"); // day 20 → past wage-protection day 3
const today = "2026-08-20";
const soon = new Date(+now + 2 * 86400000).toISOString();
const past = new Date(+now - 2 * 86400000).toISOString();

const data = {
  stations: [{ id: "n" }, { id: "e" }],
  employees: [
    { id: "m", stationId: "n", leaveRequests: [{ id: "l1", status: "pending", type: "annual" }] },
    { id: "f", stationId: "n", leaveRequests: [] },
  ],
  tasks: [
    { id: "t1", stationId: "n", status: "active", dueAt: past },   // overdue
    { id: "t2", stationId: "e", status: "active", dueAt: soon },   // due soon
    { id: "t3", stationId: "n", status: "completed", dueAt: past },
  ],
  reports: [
    { id: "r1", kind: "daily", stationId: "n", dateKey: today, approved: false, status: "pending" },
    // station "e" has no daily row today → missing
  ],
  expenses: [
    { id: "x1", status: "submitted", amount: 450, stationId: "n" },
    { id: "x2", status: "manager_approved", amount: 300, stationIds: ["e"] },
    { id: "x3", status: "finance_approved", amount: 120, stationId: "e" },
  ],
  stationBudgets: [{ stationId: "e", limit: 100 }], // posted 120 > 100 → over budget
  payrollRuns: [{
    id: "pr", status: "ready", items: [
      { employeeStationId: "n", base: 10000, allowances: 2000, bonus: 0, deductions: 500, paid: false },
      { employeeStationId: "e", base: 8000, allowances: 1000, bonus: 0, deductions: 0, paid: false },
    ],
  }],
  signatureRequests: [{ id: "s1", status: "pending" }, { id: "s2", status: "signed" }],
  workProofs: [{ id: "w1", status: "sealed", sealId: "NV-1", stationId: "n" }],
  safety: [
    { stationId: "n", level: "red", hazards: [{ id: "h1", severity: 3 }] },
    { stationId: "e", level: "green", hazards: [] },
  ],
  anonymousReports: [{ id: "a1", status: "open", stationId: "n" }],
  publicReports: [],
};

const res = deriveOwnerActions(data, { now });
const byKey = Object.fromEntries(res.items.map((i) => [i.key, i]));

// Money aggregation
assert.equal(byKey.expenses.count, 2, "two pending expenses");
assert.equal(byKey.expenses.amount, 750, "pending expense riyal exposure summed");
assert.equal(byKey.expenses.severity, "high", "over-budget raises expenses to high");
assert.equal(byKey.payroll.count, 1, "one ready payroll run");
assert.equal(byKey.payroll.amount, 20500, "payroll net = (10000+2000-500)+(8000+1000)");
assert.equal(byKey.payroll.severity, "high", "past day 3 → wage protection high");
assert.equal(res.moneyAtStake, 750 + 20500, "money at stake spans expenses + payroll");

// Operations
assert.equal(byKey.tasks.count, 2, "overdue + due soon");
assert.equal(byKey.tasks.severity, "high", "any overdue → high");
assert.equal(byKey.tasks.to, "/app/escalation", "overdue routes to escalation");
assert.equal(byKey.daily.count, 2, "1 pending + 1 missing daily report");

// People / trust / care
assert.equal(byKey.leave.count, 1);
assert.equal(byKey.signing.count, 1, "only pending signatures counted");
assert.equal(byKey.proof.count, 1, "sealed proof awaiting disclosure");
assert.equal(byKey.safety.count, 1);
assert.equal(byKey.safety.severity, "high", "red level → critical");
assert.equal(byKey.complaints.count, 1);

// Ranking: high severity first, and within high, money-at-stake ordering puts payroll (20500) before expenses (750)
assert.equal(res.items[0].key, "payroll", "highest money-at-stake high-severity item leads");
assert.ok(SEVERITY_ORDER(res.items), "items are severity-ordered");

// Station scope narrows the queue
const scoped = deriveOwnerActions(data, { now, stationIds: ["e"] });
const scopedKeys = Object.fromEntries(scoped.items.map((i) => [i.key, i]));
assert.equal(scopedKeys.leave, undefined, "no pending leave in station e scope");
assert.equal(scopedKeys.daily.count, 1, "station e is the missing daily report");
assert.equal(scopedKeys.payroll.amount, 9000, "scoped payroll = station e item only (8000+1000)");

function SEVERITY_ORDER(items) {
  const rank = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < items.length; i += 1) {
    if (rank[items[i - 1].severity] > rank[items[i].severity]) return false;
  }
  return true;
}

console.log("ownerActionCenter E2E rules: PASS");
