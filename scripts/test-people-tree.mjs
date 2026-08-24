import assert from "node:assert/strict";
import {
  applyWorkplaceManagerRule,
  buildPeopleTree,
  checkSetReportsToGate,
  descendantEmployeeIds,
  flattenPeopleTree,
  pathToPerson,
  teamsByManager,
  workplaceReportsToId,
  wouldCreateReportsCycle,
} from "../src/lib/peopleTreeGraph.js";

const data = {
  ownerId: "o1",
  employees: [
    { id: "o1", name: "المالك", role: "owner", stationId: "hq" },
    { id: "m1", name: "سالم", role: "employee", stationId: "khafji", profile: { directManagerId: "o1", position: "مدير الفرع" } },
    { id: "a1", name: "فهد", role: "employee", stationId: "port", profile: { directManagerId: "m1", position: "فني" } },
    { id: "a2", name: "خالد", role: "employee", stationId: "jeddah", profile: { position: "فني" } },
  ],
  orgSeats: [
    { id: "s1", employeeId: "m1", stationId: "khafji", title: "مدير الفرع", reportsToEmployeeId: "o1" },
    { id: "s2", employeeId: "a1", stationId: "port", title: "فني", reportsToEmployeeId: "m1" },
    { id: "s3", employeeId: "a2", stationId: "jeddah", title: "فني" },
  ],
  stations: [
    { id: "hq", name: "الرئاسة", isCompanyRoot: true, managerId: "o1" },
    { id: "khafji", name: "فرع الخفجي", parentStationId: "hq", managerId: "m1" },
    { id: "port", name: "ميناء الدمام", parentStationId: "khafji" },
    { id: "jeddah", name: "فرع جدة", parentStationId: "hq" },
  ],
};

assert.equal(wouldCreateReportsCycle(data, "m1", "a1"), true);
assert.equal(wouldCreateReportsCycle(data, "a1", "a2"), false);
assert.equal(checkSetReportsToGate(data, "m1", "a1").error, "CYCLE");
assert.equal(checkSetReportsToGate(data, "a2", "m1").ok, true);
assert.deepEqual(descendantEmployeeIds(data, "m1").sort(), ["a1"]);
assert.equal(workplaceReportsToId(data.employees.find((item) => item.id === "a1"), data), "m1");
assert.equal(workplaceReportsToId(data.employees.find((item) => item.id === "a2"), data), "o1");
assert.equal(workplaceReportsToId(data.employees.find((item) => item.id === "m1"), data), "o1");

const drifted = JSON.parse(JSON.stringify(data));
drifted.employees.find((item) => item.id === "a1").profile.directManagerId = "o1";
drifted.orgSeats.find((seat) => seat.id === "s2").reportsToEmployeeId = "o1";
assert.equal(workplaceReportsToId(drifted.employees.find((item) => item.id === "a1"), drifted), "m1");

const tree = buildPeopleTree(drifted);
const ownerNode = tree.roots.find((node) => node.id === "o1");
const khalid = ownerNode?.children.find((node) => node.id === "a2");
assert.equal(tree.roots.length, 1);
assert.equal(ownerNode.id, "o1");
assert.equal(khalid?.id, "a2");
assert.equal(khalid?.managerId, "o1");
const salem = ownerNode.children.find((node) => node.id === "m1");
const fahd = salem?.children.find((node) => node.id === "a1");
assert.equal(salem?.job, "مدير الفرع");
assert.equal(fahd?.cross, true);
assert.equal(salem?.treePeople, 2);
assert.equal(salem?.treeBranches, 1);
assert.equal(salem?.scopePeople, 2);
assert.equal(ownerNode.treePeople, 4);
assert.equal(ownerNode.treeBranches, 3);
assert.equal(ownerNode.scopePeople, 4);
assert.equal(tree.total, 4);
assert.deepEqual(pathToPerson(tree.roots, "a1").map((node) => node.id), ["o1", "m1", "a1"]);

const teams = teamsByManager(tree);
assert.equal(teams.length, 2);
assert.equal(teams[0].id, "o1");
assert.deepEqual(teams[0].items.map((node) => node.id).sort(), ["a2", "m1"]);
assert.deepEqual(teams.find((team) => team.id === "m1")?.items.map((node) => node.id), ["a1"]);

const workplace = {
  ownerId: "o1",
  employees: [
    { id: "o1", name: "المالك", role: "owner", stationId: "co", profile: {} },
    { id: "m1", name: "سالم", role: "employee", stationId: "khafji", profile: {} },
    { id: "a1", name: "فهد", role: "employee", stationId: "khafji", profile: {} },
    { id: "m2", name: "بندر", role: "employee", stationId: "dammam", profile: {} },
  ],
  orgSeats: [
    { id: "s1", employeeId: "m1", stationId: "khafji", title: "مدير الفرع" },
    { id: "s2", employeeId: "a1", stationId: "khafji", title: "فني" },
    { id: "s3", employeeId: "m2", stationId: "dammam", title: "مدير الفرع" },
  ],
  stations: [
    { id: "co", name: "المنشأة", isCompanyRoot: true, managerId: "o1" },
    { id: "east", name: "الشرقية", parentStationId: "co", managerId: "m1" },
    { id: "khafji", name: "فرع الخفجي", parentStationId: "east", managerId: "m1" },
    { id: "dammam", name: "فرع الدمام", parentStationId: "east", managerId: "m2" },
  ],
};
assert.equal(applyWorkplaceManagerRule(workplace), true);
assert.equal(workplace.employees.find((item) => item.id === "a1").profile.directManagerId, "m1");
assert.equal(workplace.employees.find((item) => item.id === "m2").profile.directManagerId, "m1");
assert.equal(workplace.employees.find((item) => item.id === "m1").profile.directManagerId, "o1");
assert.equal(applyWorkplaceManagerRule(workplace), false);

const eastScope = {
  ownerId: "o1",
  employees: [
    { id: "o1", name: "المالك", role: "owner", stationId: "co" },
    { id: "e0", name: "سلطان", role: "employee", stationId: "east" },
    { id: "k0", name: "سالم", role: "employee", stationId: "khafji" },
    { id: "k1", name: "فهد", role: "employee", stationId: "khafji" },
    { id: "w0", name: "تركي", role: "employee", stationId: "west", profile: { directManagerId: "e0" } },
    { id: "w1", name: "ماجد", role: "employee", stationId: "jeddah" },
  ],
  orgSeats: [
    { id: "s0", employeeId: "e0", stationId: "east", title: "مدير المنطقة" },
    { id: "s1", employeeId: "k0", stationId: "khafji", title: "مدير الفرع" },
    { id: "s2", employeeId: "k1", stationId: "khafji", title: "فني" },
    { id: "s3", employeeId: "w0", stationId: "east", title: "فني", reportsToEmployeeId: "e0" },
    { id: "s4", employeeId: "w1", stationId: "jeddah", title: "مدير الفرع" },
  ],
  stations: [
    { id: "co", name: "المنشأة", isCompanyRoot: true, managerId: "o1" },
    { id: "east", name: "المنطقة الشرقية", parentStationId: "co", managerId: "e0" },
    { id: "khafji", name: "فرع الخفجي", parentStationId: "east", managerId: "k0" },
    { id: "dammam", name: "فرع الدمام", parentStationId: "east" },
    { id: "office", name: "المكتب", parentStationId: "dammam" },
    { id: "port", name: "الميناء", parentStationId: "dammam" },
    { id: "west", name: "المنطقة الغربية", parentStationId: "co", managerId: "w0" },
    { id: "jeddah", name: "فرع جدة", parentStationId: "west", managerId: "w1" },
  ],
};
const eastTree = buildPeopleTree(eastScope);
const sultan = flattenPeopleTree(eastTree.roots).find((node) => node.id === "e0");
assert.equal(sultan?.treeBranches, 4);
assert.equal(sultan?.scopePeople, 3);
assert.equal(sultan?.scopePeople < eastScope.employees.length, true);

console.log("people tree ok");
