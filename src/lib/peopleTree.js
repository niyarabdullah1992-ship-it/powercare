import { updateCompany } from "@/lib/store";
import { seatForEmployee } from "@/lib/orgHire";
import { applyWorkplaceManagerRule, checkSetReportsToGate } from "@/lib/peopleTreeGraph";

export {
  allowedReportsTo,
  buildPeopleTree,
  checkSetReportsToGate,
  descendantEmployeeIds,
  flattenPeopleTree,
  pathToPerson,
  reportsToId,
  reportsWord,
  teamsByManager,
  applyWorkplaceManagerRule,
  workplaceReportsToId,
  wouldCreateReportsCycle,
} from "@/lib/peopleTreeGraph";

export function setEmployeeReportsTo(companyId, employeeId, managerId) {
  let error = "";
  updateCompany(companyId, (data) => {
    const gate = checkSetReportsToGate(data, employeeId, managerId);
    if (!gate.ok) {
      error = gate.error;
      return;
    }
    const employee = (data.employees || []).find((item) => String(item.id) === String(employeeId));
    if (!employee) {
      error = "MISSING";
      return;
    }
    const manager = gate.managerId
      ? (data.employees || []).find((item) => String(item.id) === String(gate.managerId))
      : null;
    const seat = seatForEmployee(data, employee.id);
    const managerSeat = manager ? seatForEmployee(data, manager.id) : null;
    if (seat) {
      seat.reportsToEmployeeId = manager?.id || null;
      seat.reportsToSeatId = managerSeat?.id || null;
      seat.reportsToName = manager?.name || "";
      seat.approverId = manager?.id || seat.approverId || null;
      seat.reportsToMissing = "";
    }
    employee.profile = { ...(employee.profile || {}), directManagerId: manager?.id || null };
    const node = (data.orgTree || []).find((item) => item.type === "employee" && String(item.refId) === String(employee.id));
    const parentNode = manager
      ? (data.orgTree || []).find((item) => item.type === "employee" && String(item.refId) === String(manager.id))
      : null;
    if (node) node.parentId = parentNode?.id || null;
  });
  if (error) return { ok: false, error };
  return { ok: true };
}

export function syncWorkplaceManagers(companyId) {
  if (!companyId) return { ok: false };
  updateCompany(companyId, (data) => {
    applyWorkplaceManagerRule(data);
  });
  return { ok: true };
}
