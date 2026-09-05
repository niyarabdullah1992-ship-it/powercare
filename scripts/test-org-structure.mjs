import assert from "node:assert/strict";
import {
  actingAtStation,
  appendOrgStructureEvent,
  flattenOrgBranches,
  formatOrgStructureEvent,
  orgStructureEvents,
  pathToOrgBranch,
  printOrgPyramidRows,
  workplaceEscalationManagers,
  workplaceManagerDisplay,
} from "../src/lib/orgStructureLog.js";

const data = { orgStructureLog: [], stations: [{ id: "khafji", name: "الخفجي" }], employees: [{ id: "m1", name: "سالم" }] };
appendOrgStructureEvent(data, { type: "created", stationId: "khafji", stationName: "الخفجي" });
appendOrgStructureEvent(data, { type: "manager", stationId: "khafji", to: "m1", toName: "سالم" });
assert.equal(orgStructureEvents(data)[0].type, "manager");
assert.equal(orgStructureEvents(data).length, 2);
assert.match(formatOrgStructureEvent(orgStructureEvents(data)[0], true), /سالم/);

const live = {
  employees: [
    { id: "m1", name: "سالم" },
    { id: "a1", name: "فهد", actingAssignments: [{ stationId: "port", until: "2099-12-01" }] },
  ],
  stations: [
    { id: "hq", managerId: "m1" },
    { id: "port", parentStationId: "hq" },
  ],
};
assert.equal(actingAtStation(live, "port")?.employee?.id, "a1");
assert.equal(actingAtStation(live, "hq"), null);
const steps = workplaceEscalationManagers(live, "port");
assert.deepEqual(steps.map((step) => step.employeeId), ["a1", "m1"]);
assert.equal(steps[0].acting, true);

const covered = {
  employees: [
    { id: "m1", name: "سالم" },
    { id: "a1", name: "فهد", actingAssignments: [{ stationId: "hq", until: "2099-12-01" }] },
  ],
  stations: [
    { id: "hq", managerId: "m1" },
  ],
};
assert.deepEqual(workplaceEscalationManagers(covered, "hq").map((step) => [step.employeeId, step.acting]), [["a1", true]]);

const people = [
  { name: "فني بعنوان مدير", job: "مدير الفرع", employeeId: "tech" },
  { name: "سالم", job: "مدير الفرع", employeeId: "m1" },
];
assert.deepEqual(workplaceManagerDisplay({ id: "port" }, people), { managerId: "", managerName: "", managerTitle: "" });
assert.equal(workplaceManagerDisplay({ id: "hq", managerId: "m1" }, people).managerName, "سالم");

const tree = [
  { stationId: "hq", name: "الرئاسة", managerId: "m1", managerName: "سالم", children: [
    { stationId: "port", name: "الميناء", managerId: "", actingName: "فهد", children: [] },
  ] },
];
assert.deepEqual(pathToOrgBranch(tree, "port").map((node) => node.stationId), ["hq", "port"]);
assert.equal(flattenOrgBranches(tree).length, 2);
const printed = printOrgPyramidRows(tree, true);
assert.equal(printed[1][1], "بالوكالة · فهد");

console.log("org structure ok");
