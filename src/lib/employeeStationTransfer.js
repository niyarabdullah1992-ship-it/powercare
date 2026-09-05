/**
 * Station-to-station employee transfer — dated employment action.
 * Updates stationId + org tree together; history is never silently overwritten.
 */
import { ACTION_REASONS } from "@/lib/hcmDerivations";
import { updateCompany, getCompanyData, addNotification } from "@/lib/store";
import { applyWorkplaceManagerRule } from "@/lib/peopleTreeGraph";
import { appendOrgStructureEvent } from "@/lib/orgStructureLog";
import { isManagerUnit, stripDescendantCoverage } from "@/lib/stationTree";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function renumber(nodes, parentId) {
  nodes
    .filter((n) => (n.parentId || null) === (parentId || null))
    .sort((a, b) => a.order - b.order)
    .forEach((n, i) => { n.order = i; });
}

export function checkStationTransferGate({
  employee,
  toStationId,
  actorId,
  reasonCode,
  effectiveDate,
  stations = [],
} = {}) {
  if (!employee?.id) {
    return { ok: false, error: "EMPLOYEE_REQUIRED", reason: "الموظف مطلوب.", reasonEn: "Employee is required." };
  }
  if (actorId && String(actorId) === String(employee.id)) {
    return {
      ok: false,
      error: "SELF_TRANSFER_FORBIDDEN",
      reason: "فصل المهام: لا تنقل نفسك — يسجّل النقل مسؤول آخر.",
      reasonEn: "Segregation of duties: you cannot transfer yourself — another manager must record it.",
    };
  }
  if (employee.active === false) {
    return {
      ok: false,
      error: "EMPLOYEE_INACTIVE",
      reason: "الموظف غير نشط — فعّله قبل النقل.",
      reasonEn: "Employee is inactive — reactivate before transferring.",
    };
  }
  const toId = String(toStationId || "").trim();
  if (!toId) {
    return { ok: false, error: "TARGET_STATION_REQUIRED", reason: "الفرع الوجهة مطلوب.", reasonEn: "Target branch is required." };
  }
  const fromId = employee.stationId ? String(employee.stationId) : null;
  if (fromId && fromId === toId) {
    return {
      ok: false,
      error: "SAME_STATION",
      reason: "الموظف على هذا الفرع بالفعل.",
      reasonEn: "The employee is already at that branch.",
    };
  }
  if (!stations.some((s) => String(s.id) === toId)) {
    return { ok: false, error: "STATION_NOT_FOUND", reason: "الفرع الوجهة غير موجود.", reasonEn: "Target branch not found." };
  }
  const target = stations.find((s) => String(s.id) === toId);
  if (isManagerUnit(target)) {
    return {
      ok: false,
      error: "ADMIN_NO_HIRE",
      reason: "المدير ليس مكان توظيف. حوّله إلى فرع ثم انقل إليه.",
      reasonEn: "A manager is not a workplace. Convert it to a branch, then transfer there.",
    };
  }
  const day = String(effectiveDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return { ok: false, error: "EFFECTIVE_DATE_REQUIRED", reason: "تاريخ سريان النقل مطلوب.", reasonEn: "Transfer effective date is required." };
  }
  const allowed = ACTION_REASONS.transfer || [];
  const reason = String(reasonCode || "").trim();
  if (!reason || !allowed.some((r) => r.id === reason)) {
    return {
      ok: false,
      error: "ACTION_REASON_REQUIRED",
      reason: "سبب النقل مُرمَّز مطلوب للتدقيق.",
      reasonEn: "A coded transfer reason is required for audit.",
    };
  }
  return { ok: true, fromStationId: fromId, toStationId: toId, effectiveDate: day, reasonCode: reason };
}

function ensureStationOrgNode(data, stationId) {
  data.orgTree = Array.isArray(data.orgTree) ? data.orgTree : [];
  let node = data.orgTree.find((n) => n.type === "station" && String(n.refId) === String(stationId));
  if (node) return node;
  const station = (data.stations || []).find((s) => String(s.id) === String(stationId));
  node = {
    id: `org_station_${stationId}`,
    type: "station",
    refId: stationId,
    title: station?.location || station?.type || "",
    parentId: null,
    order: data.orgTree.filter((n) => !n.parentId).length,
  };
  data.orgTree.push(node);
  return node;
}

function moveEmployeeOrgNode(data, employeeId, stationId) {
  const stationNode = ensureStationOrgNode(data, stationId);
  data.orgTree = Array.isArray(data.orgTree) ? data.orgTree : [];
  let node = data.orgTree.find((n) => n.type === "employee" && String(n.refId) === String(employeeId));
  const emp = (data.employees || []).find((e) => e.id === employeeId);
  const oldParent = node?.parentId || null;
  if (!node) {
    const position = (data.smartPositions || []).find((p) => p.employeeId === employeeId);
    node = {
      id: `org_${employeeId}`,
      type: "employee",
      refId: employeeId,
      title: position?.title || emp?.profile?.position || emp?.position || "",
      parentId: stationNode.id,
      order: 0,
    };
    data.orgTree.push(node);
  } else {
    node.parentId = stationNode.id;
  }
  node.order = data.orgTree.filter((n) => n.id !== node.id && n.parentId === stationNode.id).length;
  renumber(data.orgTree, oldParent);
  renumber(data.orgTree, stationNode.id);
}

/**
 * Transfer employee between stations — updates live station, org tree, and dated register.
 */
export function transferEmployeeBetweenStations(companyId, {
  employeeId,
  toStationId,
  reasonCode,
  effectiveDate,
  note,
  actor,
} = {}) {
  const data = getCompanyData(companyId);
  const employee = (data?.employees || []).find((e) => e.id === employeeId);
  const gate = checkStationTransferGate({
    employee,
    toStationId,
    actorId: actor?.id,
    reasonCode,
    effectiveDate: effectiveDate || todayKey(),
    stations: data?.stations || [],
  });
  if (!gate.ok) return { ok: false, ...gate };

  const fromStation = (data.stations || []).find((s) => String(s.id) === String(gate.fromStationId));
  const toStation = (data.stations || []).find((s) => String(s.id) === String(gate.toStationId));
  const record = {
    id: uid("xfer"),
    type: "transfer",
    employeeId,
    fromStationId: gate.fromStationId,
    toStationId: gate.toStationId,
    fromStationName: fromStation?.name || null,
    toStationName: toStation?.name || null,
    effectiveDate: gate.effectiveDate,
    reasonCode: gate.reasonCode,
    note: String(note || "").trim().slice(0, 240) || null,
    recordedBy: actor?.id || null,
    recordedByName: actor?.name || "—",
    recordedAt: new Date().toISOString(),
    voidedAt: null,
  };

  updateCompany(companyId, (d) => {
    const emp = (d.employees || []).find((e) => e.id === employeeId);
    if (!emp) return;
    // Close previous open station period on the employee register.
    emp.stationHistory = Array.isArray(emp.stationHistory) ? emp.stationHistory : [];
    const open = emp.stationHistory.find((h) => h.stationId === emp.stationId && !h.effectiveTo);
    if (open) open.effectiveTo = gate.effectiveDate;
    else if (emp.stationId) {
      emp.stationHistory.push({
        stationId: emp.stationId,
        effectiveFrom: emp.hireDate || emp.createdAt?.slice(0, 10) || gate.effectiveDate,
        effectiveTo: gate.effectiveDate,
      });
    }
    emp.stationHistory.push({
      stationId: gate.toStationId,
      effectiveFrom: gate.effectiveDate,
      effectiveTo: null,
      transferId: record.id,
    });

    emp.stationId = gate.toStationId;
    if (emp.hrStationId && emp.hrStationId === gate.fromStationId) {
      emp.hrStationId = gate.toStationId;
    }
    emp.managedStations = stripDescendantCoverage(
      (emp.managedStations || []).map((id) =>
        String(id) === String(gate.fromStationId) ? gate.toStationId : id,
      ),
      d.stations || [],
      gate.toStationId,
    );

    emp.stationTransfers = Array.isArray(emp.stationTransfers) ? emp.stationTransfers : [];
    emp.stationTransfers.unshift(record);

    (d.orgSeats || []).forEach((seat) => {
      if (String(seat.employeeId) === String(employeeId)) seat.stationId = gate.toStationId;
    });
    (d.stations || []).forEach((station) => {
      const managerSeat = (d.orgSeats || []).find((seat) =>
        String(seat.stationId) === String(station.id)
        && (String(seat.title || "").includes("مدير الفرع") || /branch manager/i.test(String(seat.title || "")))
      );
      if (managerSeat) station.managerId = managerSeat.employeeId || null;
    });
    applyWorkplaceManagerRule(d);

    d.employmentActions = Array.isArray(d.employmentActions) ? d.employmentActions : [];
    d.employmentActions.push({
      ...record,
      companyId,
      positionId: null,
      kind: "station_transfer",
    });

    appendOrgStructureEvent(d, {
      type: "transfer",
      employeeId,
      employeeName: emp.name,
      fromStationId: gate.fromStationId,
      toStationId: gate.toStationId,
    });

    moveEmployeeOrgNode(d, employeeId, gate.toStationId);
  });

  const msgAr = `نُقل ${employee.name} من ${fromStation?.name || "—"} إلى ${toStation?.name || "—"} اعتبارًا من ${gate.effectiveDate}`;
  const notifyIds = new Set([employeeId]);
  if (data?.ownerId) notifyIds.add(String(data.ownerId));
  for (const e of data?.employees || []) {
    if (["director", "ops_manager", "pgm"].includes(e.role)) notifyIds.add(String(e.id));
    if (e.role === "station_manager" && (
      String(e.stationId) === String(gate.fromStationId)
      || String(e.stationId) === String(gate.toStationId)
    )) notifyIds.add(String(e.id));
  }
  if (actor?.id) notifyIds.delete(String(actor.id));
  for (const id of notifyIds) addNotification(companyId, id, msgAr);

  return { ok: true, record, employee: getCompanyData(companyId)?.employees?.find((e) => e.id === employeeId) };
}

export function quickTransferEmployee(companyId, { employeeId, toStationId, actor } = {}) {
  return transferEmployeeBetweenStations(companyId, {
    employeeId,
    toStationId,
    reasonCode: "operational_need",
    effectiveDate: todayKey(),
    actor,
  });
}
