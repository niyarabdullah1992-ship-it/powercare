// When an employee is appointed on a job seat they inherit its title, grade,
// manager and approval path — applied to the local company store (which syncs up).
import { updateCompany } from "@/lib/store";

export function applySeatToEmployee(companyId, employeeId, seat, title) {
  updateCompany(companyId, (data) => {
    const employee = (data.employees || []).find((item) => item.id === employeeId);
    if (!employee) return;
    employee.stationId = seat.unitId || employee.stationId || null;
    employee.profile = { ...(employee.profile || {}), seatId: seat.id, position: title?.name || "", jobLadder: title?.ladder || "", jobGrade: title?.grade || "" };
    // Approval/escalation path: hang the employee node under the seat manager's
    // node (or the unit's station node) in the org tree.
    data.orgTree = data.orgTree || [];
    const nodes = data.orgTree;
    const managerNode = seat.managerId ? nodes.find((node) => node.type === "employee" && node.refId === seat.managerId) : null;
    const stationNode = seat.unitId ? nodes.find((node) => node.type === "station" && node.refId === seat.unitId) : null;
    const parentId = managerNode?.id || stationNode?.id || null;
    let node = nodes.find((item) => item.type === "employee" && item.refId === employeeId);
    if (!node) {
      node = { id: `org_${employeeId}`, type: "employee", refId: employeeId, title: title?.name || "", parentId, order: 0 };
      nodes.push(node);
    } else {
      node.parentId = parentId;
      node.title = title?.name || node.title;
    }
    node.order = nodes.filter((item) => item.id !== node.id && (item.parentId || null) === (parentId || null)).length;
  });
}

export function createEmployeeFromInvite(companyId, invite, presetId) {
  const employeeId = presetId || `emp_${Math.random().toString(36).slice(2, 9)}`;
  updateCompany(companyId, (data) => {
    data.employees.push({
      id: employeeId,
      name: invite.name,
      email: String(invite.email || "").toLowerCase(),
      role: "employee",
      stationId: null,
      phone: invite.phone || "",
      anonymousId: `ANON-${Math.floor(Math.random() * 1e8).toString(16).toUpperCase().padStart(8, "0")}`,
      managedStations: [],
      profile: { jobNumber: invite.jobNumber || "" },
      createdAt: new Date().toISOString(),
    });
  });
  return employeeId;
}