import { updateCompany } from "@/lib/store";
import { sortComplaintChainByTree } from "@/lib/escalation";
import { rankFromScore, scorePermissions } from "@/lib/smartPositions";

export const orgTreeNodes = (data) => Array.isArray(data?.orgTree) ? data.orgTree : [];
export const nodeAccess = (data, refId) => data?.smartPositions?.find((item) => item.employeeId === refId)?.permissions || {};

export function toggleComplaintEscalationMember(companyId, employeeId) {
  updateCompany(companyId, (data) => {
    const current = data.complaintEscalationChain || [];
    const adding = !current.includes(employeeId);
    const next = adding ? [...current, employeeId] : current.filter((id) => id !== employeeId);
    data.complaintEscalationChain = sortComplaintChainByTree(next, data);
    if (adding) {
      const position = (data.smartPositions || []).find((item) => item.employeeId === employeeId);
      if (position) position.permissions = { ...(position.permissions || {}), complaints: "manage" };
    }
    [...(data.anonymousReports || []), ...(data.publicReports || [])].filter((report) => report.status === "open").forEach((report) => { report.escalationLevel = Math.min(report.escalationLevel || 0, Math.max(0, data.complaintEscalationChain.length - 1)); });
  });
}

const renumber = (nodes, parentId) => nodes.filter((node) => (node.parentId || null) === (parentId || null)).sort((a, b) => a.order - b.order).forEach((node, index) => { node.order = index; });

const treeStationForNode = (nodes, node) => {
  let parent = nodes.find((item) => item.id === node.parentId);
  while (parent && parent.type !== "station") parent = nodes.find((item) => item.id === parent.parentId);
  return parent?.refId || null;
};

export function stationIdForTreeEmployee(data, employeeId) {
  const nodes = data?.orgTree || [];
  const node = nodes.find((item) => item.type === "employee" && item.refId === employeeId);
  return node ? treeStationForNode(nodes, node) : null;
}

export function assignEmployeeToOrgStation(companyId, employeeId, stationNodeId) {
  updateCompany(companyId, (data) => {
    const nodes = data.orgTree || [];
    const station = nodes.find((node) => node.id === stationNodeId && node.type === "station");
    const employee = (data.employees || []).find((item) => item.id === employeeId);
    if (!station || !employee) return;
    let node = nodes.find((item) => item.type === "employee" && item.refId === employeeId);
    const oldParent = node?.parentId || null;
    if (!node) {
      const position = (data.smartPositions || []).find((item) => item.employeeId === employeeId);
      node = { id: `org_${employeeId}`, type: "employee", refId: employeeId, title: position?.title || employee.profile?.position || employee.position || "", parentId: station.id, order: 0 };
      nodes.push(node);
    }
    node.parentId = station.id;
    node.order = nodes.filter((item) => item.id !== node.id && item.parentId === station.id).length;
    renumber(nodes, oldParent);
    renumber(nodes, station.id);
    syncEmployeeStationsFromTree(data);
  });
}

export function unassignEmployeeFromOrgTree(companyId, nodeId) {
  updateCompany(companyId, (data) => {
    const nodes = data.orgTree || [];
    const node = nodes.find((item) => item.id === nodeId && item.type === "employee");
    if (!node || nodes.some((item) => item.parentId === node.id)) return;
    const employee = (data.employees || []).find((item) => item.id === node.refId);
    const oldParent = node.parentId || null;
    node.parentId = null;
    node.order = nodes.filter((item) => item.id !== node.id && !item.parentId).length;
    if (employee) employee.stationId = null;
    renumber(nodes, oldParent);
    renumber(nodes, null);
  });
}

export function positionManagerInOrgTree(companyId, employeeId, stationIds) {
  updateCompany(companyId, (data) => {
    const nodes = data.orgTree || [];
    const manager = nodes.find((node) => node.type === "employee" && node.refId === employeeId);
    const selectedIds = new Set((stationIds || []).filter(Boolean));
    const stations = nodes.filter((node) => node.type === "station" && selectedIds.has(node.refId));
    if (!manager || !stations.length) return;
    const oldParent = manager.parentId || null;
    const affected = new Set([oldParent, manager.id]);
    const isBelowManager = (node) => {
      let cursor = node;
      while (cursor?.parentId) {
        if (cursor.parentId === manager.id) return true;
        cursor = nodes.find((item) => item.id === cursor.parentId);
      }
      return false;
    };
    nodes.filter((node) => node.type === "station" && isBelowManager(node)).forEach((node) => {
      affected.add(node.parentId || null);
      node.parentId = oldParent;
    });
    if (stations.length === 1) {
      const station = stations[0];
      affected.add(station.id);
      manager.parentId = station.id;
      manager.order = nodes.filter((node) => node.parentId === station.id && node.id !== manager.id).length;
    } else {
      const parents = stations.map((station) => station.parentId || null);
      const commonParent = parents.every((parent) => parent === parents[0]) && !stations.some((station) => station.id === parents[0]) ? parents[0] : null;
      manager.parentId = commonParent;
      manager.order = nodes.filter((node) => (node.parentId || null) === commonParent && node.id !== manager.id).length;
      affected.add(commonParent);
      stations.forEach((station, index) => {
        affected.add(station.parentId || null);
        station.parentId = manager.id;
        station.order = index;
      });
    }
    affected.add(manager.parentId || null);
    affected.forEach((parentId) => renumber(nodes, parentId));
    syncEmployeeStationsFromTree(data);
  });
}

const syncEmployeeStationsFromTree = (data) => {
  const nodes = data.orgTree || [];
  nodes.filter((node) => node.type === "employee").forEach((node) => {
    const stationId = treeStationForNode(nodes, node);
    if (!stationId) return;
    const employee = (data.employees || []).find((item) => item.id === node.refId || item.employeeId === node.refId);
    if (employee) employee.stationId = stationId;
  });
};

export function initializeOrgTree(companyId, data) {
  const existing = Array.isArray(data?.orgTree)
    ? data.orgTree
    : (data.smartPositions || []).map((position, order) => ({ id: `org_${position.employeeId}`, type: "employee", refId: position.employeeId, title: position.title || "", parentId: null, order }));
  const stationIds = new Set(existing.filter((node) => node.type === "station").map((node) => node.refId));
  const missingStations = (data.stations || []).filter((station) => !stationIds.has(station.id));
  const stationMismatch = existing.filter((node) => node.type === "employee").some((node) => {
    const stationId = treeStationForNode(existing, node);
    const employee = (data.employees || []).find((item) => item.id === node.refId);
    return stationId && employee?.stationId !== stationId;
  });
  if (Array.isArray(data?.orgTree) && !missingStations.length && !stationMismatch) return;
  updateCompany(companyId, (draft) => {
    draft.orgTree = [...existing, ...missingStations.map((station, index) => ({ id: `org_station_${station.id}`, type: "station", refId: station.id, title: station.location || "", parentId: null, order: existing.length + index }))];
    syncEmployeeStationsFromTree(draft);
  });
}

export function saveOrgNode(companyId, node, permissions = {}) {
  updateCompany(companyId, (data) => {
    data.orgTree = data.orgTree || [];
    const index = data.orgTree.findIndex((item) => item.id === node.id);
    const current = data.orgTree[index];
    const requestedParent = data.orgTree.find((item) => item.id === node.parentId);
    let cursor = requestedParent;
    while (current && cursor?.parentId) {
      if (cursor.parentId === current.id) {
        const previousParent = requestedParent.parentId || null;
        requestedParent.parentId = current.parentId || null;
        requestedParent.order = current.order;
        renumber(data.orgTree, previousParent);
        break;
      }
      cursor = data.orgTree.find((item) => item.id === cursor.parentId);
    }
    if (index >= 0) data.orgTree[index] = node; else data.orgTree.push(node);
    renumber(data.orgTree, node.parentId);
    if (node.type === "employee") {
      data.smartPositions = data.smartPositions || [];
      const savedIndex = data.smartPositions.findIndex((item) => item.employeeId === node.refId);
      const score = scorePermissions(permissions);
      const record = { employeeId: node.refId, title: node.title, titleManual: true, permissions, score, rank: rankFromScore(score), updatedAt: new Date().toISOString() };
      if (savedIndex >= 0) data.smartPositions[savedIndex] = { ...data.smartPositions[savedIndex], ...record }; else data.smartPositions.push(record);
    }
    syncEmployeeStationsFromTree(data);
  });
}

export function createOrgRecord(companyId, record, permissions = {}) {
  let createdStationId = null;
  updateCompany(companyId, (data) => {
    data.orgTree = data.orgTree || [];
    const parentId = record.parentId || null;
    const order = data.orgTree.filter((node) => (node.parentId || null) === parentId).length;
    if (record.type === "station") {
      const id = `st_${Math.random().toString(36).slice(2, 9)}`;
      createdStationId = id;
      data.stations.push({ id, name: record.name.trim(), location: record.location.trim(), type: record.stationType.trim(), status: "active", managerId: null, lat: record.lat ?? null, lng: record.lng ?? null, radiusMeters: record.radiusMeters ?? 200, createdAt: new Date().toISOString() });
      data.orgTree.push({ id: `org_station_${id}`, type: "station", refId: id, title: record.stationType.trim() || record.location.trim(), parentId, order });
      return;
    }
    const id = `emp_${Math.random().toString(36).slice(2, 9)}`;
    data.employees.push({ id, name: record.name.trim(), email: record.email, role: "employee", stationId: record.stationId || null, phone: "", anonymousId: `ANON-${Math.floor(Math.random() * 1e8).toString(16).toUpperCase().padStart(8, "0")}`, managedStations: [], profile: {}, createdAt: new Date().toISOString() });
    data.orgTree.push({ id: `org_${id}`, type: "employee", refId: id, title: record.title, parentId, order });
    const score = scorePermissions(permissions);
    data.smartPositions = data.smartPositions || [];
    data.smartPositions.push({ employeeId: id, title: record.title, titleManual: true, permissions, score, rank: rankFromScore(score), updatedAt: new Date().toISOString() });
    syncEmployeeStationsFromTree(data);
  });
  return createdStationId;
}

export function saveOrgStationName(companyId, stationId, name) {
  updateCompany(companyId, (data) => {
    const station = (data.stations || []).find((item) => item.id === stationId);
    if (station && name) station.name = name;
  });
}

export function saveOrgStationLocation(companyId, stationId, location) {
  updateCompany(companyId, (data) => {
    const station = (data.stations || []).find((item) => item.id === stationId);
    if (station) Object.assign(station, location);
  });
}

export function saveOrgNodeVisualPosition(companyId, nodeId, position) {
  updateCompany(companyId, (data) => {
    data.orgVisualPositions = { ...(data.orgVisualPositions || {}), [nodeId]: position };
  });
}

export function moveOrgNode(companyId, nodeId, targetId, mode) {
  updateCompany(companyId, (data) => {
    const nodes = data.orgTree || [];
    const moving = nodes.find((node) => node.id === nodeId);
    const target = nodes.find((node) => node.id === targetId);
    if (!moving || !target || moving.id === target.id) return;
    const oldParent = moving.parentId || null;
    let cursor = target;
    let targetIsDescendant = false;
    while (cursor?.parentId) {
      if (cursor.parentId === moving.id) { targetIsDescendant = true; break; }
      cursor = nodes.find((node) => node.id === cursor.parentId);
    }
    if (targetIsDescendant) {
      if (mode !== "below" && mode !== "inside") return;
      const targetOldParent = target.parentId || null;
      target.parentId = oldParent;
      target.order = moving.order;
      renumber(nodes, targetOldParent);
      renumber(nodes, oldParent);
    }
    if (mode === "above") {
      const targetParent = target.parentId || null;
      moving.parentId = targetParent;
      moving.order = target.order;
      target.parentId = moving.id;
      target.order = nodes.filter((node) => node.id !== target.id && node.parentId === moving.id).length;
      renumber(nodes, oldParent);
      renumber(nodes, targetParent);
      renumber(nodes, moving.id);
      syncEmployeeStationsFromTree(data);
      return;
    }
    const newParent = mode === "below" || mode === "inside" ? target.id : target.parentId || null;
    moving.parentId = newParent;
    const siblings = nodes.filter((node) => node.id !== moving.id && (node.parentId || null) === newParent).sort((a, b) => a.order - b.order);
    const targetIndex = siblings.findIndex((node) => node.id === target.id);
    moving.order = mode === "below" || mode === "inside" ? siblings.length : Math.max(0, targetIndex + (mode === "right" ? 1 : 0));
    siblings.splice(moving.order, 0, moving);
    siblings.forEach((node, index) => { node.order = index; });
    renumber(nodes, oldParent);
    syncEmployeeStationsFromTree(data);
  });
}

export function deleteOrgNode(companyId, nodeId) {
  updateCompany(companyId, (data) => {
    const nodes = data.orgTree || [];
    const removed = nodes.find((node) => node.id === nodeId);
    if (!removed) return;
    nodes.filter((node) => node.parentId === nodeId).forEach((node) => { node.parentId = removed.parentId || null; });
    data.orgTree = nodes.filter((node) => node.id !== nodeId);
    renumber(data.orgTree, removed.parentId);
    syncEmployeeStationsFromTree(data);
    if (removed.type === "employee") data.complaintEscalationChain = (data.complaintEscalationChain || []).filter((id) => id !== removed.refId);
  });
}