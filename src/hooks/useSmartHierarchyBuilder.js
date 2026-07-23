import { useMemo, useState } from "react";
import { updateCompany } from "@/lib/store";
import { MANAGER_PERMISSIONS, ASSISTANT_PERMISSIONS } from "@/lib/hrLevels";

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
const managerRoles = new Set(["director", "ops_manager", "pgm", "station_manager"]);

export default function useSmartHierarchyBuilder(data, companyId) {
  const [quickStationId, setQuickStationId] = useState(data.stations?.[0]?.id || "");
  const managers = useMemo(() => data.employees.filter((employee) => {
    const level = data.hrLevels?.find((item) => item.id === employee.hrLevelId);
    return employee.id === data.ownerId || managerRoles.has(employee.role) || level?.role === "manager";
  }), [data.employees, data.hrLevels, data.ownerId]);
  const people = data.employees.filter((employee) => employee.id !== data.ownerId);
  const levels = (data.hrLevels || []).filter((level) => level.active !== false);
  const stationCluster = (stationId) => (data.hrClusters || []).find((cluster) => (cluster.stationIds || []).includes(stationId));

  const assignEmployee = (employeeId, destinationId) => updateCompany(companyId, (draft) => {
    const employee = draft.employees.find((item) => item.id === employeeId);
    if (!employee) return;
    employee.profile = employee.profile || {};
    if (destinationId === "people:unassigned") { employee.profile.directManagerId = null; return; }
    if (destinationId.startsWith("manager:")) {
      const manager = draft.employees.find((item) => item.id === destinationId.slice(8));
      if (!manager || manager.id === employee.id) return;
      let cursor = manager;
      const visited = new Set();
      while (cursor?.profile?.directManagerId && !visited.has(cursor.id)) {
        if (cursor.profile.directManagerId === employee.id) return;
        visited.add(cursor.id);
        cursor = draft.employees.find((item) => item.id === cursor.profile.directManagerId);
      }
      employee.profile.directManagerId = manager.id;
      if (manager.role === "station_manager") employee.stationId = manager.stationId || manager.managedStations?.[0] || employee.stationId;
      return;
    }
    if (!destinationId.startsWith("position:")) return;
    const level = draft.hrLevels.find((item) => item.id === destinationId.slice(9));
    if (!level) return;
    employee.hrLevelId = level.id;
    employee.position = level.name || employee.position;
    employee.profile.position = level.name || employee.profile.position || employee.position;
    employee.hrStationId = level.scope === "station" ? (employee.stationId || quickStationId || draft.stations?.[0]?.id) : null;
    const cluster = (draft.hrClusters || []).find((item) => (item.stationIds || []).includes(employee.stationId || employee.hrStationId));
    employee.hrClusterId = level.scope === "cluster" ? cluster?.id || null : null;
    const higher = draft.hrLevels.filter((item) => item.role === "manager" && item.order > level.order && item.active !== false).sort((a, b) => a.order - b.order);
    employee.profile.directManagerId = draft.employees.find((item) => higher.some((candidate) => candidate.id === item.hrLevelId))?.id || draft.ownerId || null;
  });

  const moveStation = (stationId, destinationId) => updateCompany(companyId, (draft) => {
    draft.hrClusters = draft.hrClusters || [];
    draft.hrClusters.forEach((cluster) => { cluster.stationIds = (cluster.stationIds || []).filter((id) => id !== stationId); });
    if (destinationId.startsWith("cluster:")) {
      const cluster = draft.hrClusters.find((item) => item.id === destinationId.slice(8));
      if (cluster && !cluster.stationIds.includes(stationId)) cluster.stationIds.push(stationId);
    }
  });

  const onDragEnd = ({ draggableId, destination }) => {
    if (!destination) return;
    if (draggableId.startsWith("employee:")) assignEmployee(draggableId.slice(9), destination.droppableId);
    if (draggableId.startsWith("station:")) moveStation(draggableId.slice(8), destination.droppableId);
  };

  const quickAdd = ({ name, position, stationId, managerId }) => updateCompany(companyId, (draft) => {
    const station = draft.stations.find((item) => item.id === stationId);
    draft.employees.push({ id: uid("emp"), name, email: "", role: "employee", stationId, phone: "", anonymousId: uid("ANON"), profile: { position, directManagerId: managerId || station?.managerId || null }, createdAt: new Date().toISOString() });
  });
  const updatePosition = (employeeId, position) => updateCompany(companyId, (draft) => {
    const employee = draft.employees.find((item) => item.id === employeeId);
    if (employee) { employee.profile = employee.profile || {}; employee.profile.position = position; }
  });

  const applyTemplate = (scope, managerName, assistantName) => updateCompany(companyId, (draft) => {
    draft.hrLevels = draft.hrLevels || [];
    if (draft.hrLevels.some((level) => level.scope === scope && level.name === managerName)) return;
    const order = Math.max(0, ...draft.hrLevels.map((level) => level.order || 0)) + 1;
    draft.hrLevels.push({ id: uid("hrlvl"), order, role: "manager", scope, name: managerName, permissions: MANAGER_PERMISSIONS, maxCount: null });
    draft.hrLevels.push({ id: uid("hrlvl"), order, role: "assistant", scope, name: assistantName, permissions: ASSISTANT_PERMISSIONS, maxCount: null });
  });

  return { people, managers, levels, stationCluster, quickStationId, setQuickStationId, onDragEnd, quickAdd, updatePosition, applyTemplate };
}