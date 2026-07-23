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

export function initializeOrgTree(companyId, data) {
  const existing = Array.isArray(data?.orgTree)
    ? data.orgTree
    : (data.smartPositions || []).map((position, order) => ({ id: `org_${position.employeeId}`, type: "employee", refId: position.employeeId, title: position.title || "", parentId: null, order }));
  const stationIds = new Set(existing.filter((node) => node.type === "station").map((node) => node.refId));
  const missingStations = (data.stations || []).filter((station) => !stationIds.has(station.id));
  if (Array.isArray(data?.orgTree) && !missingStations.length) return;
  updateCompany(companyId, (draft) => {
    draft.orgTree = [...existing, ...missingStations.map((station, index) => ({ id: `org_station_${station.id}`, type: "station", refId: station.id, title: station.location || "", parentId: null, order: existing.length + index }))];
  });
}

export function saveOrgNode(companyId, node, permissions = {}) {
  updateCompany(companyId, (data) => {
    data.orgTree = data.orgTree || [];
    const index = data.orgTree.findIndex((item) => item.id === node.id);
    if (index >= 0) data.orgTree[index] = node; else data.orgTree.push(node);
    renumber(data.orgTree, node.parentId);
    if (node.type === "employee") {
      data.smartPositions = data.smartPositions || [];
      const savedIndex = data.smartPositions.findIndex((item) => item.employeeId === node.refId);
      const score = scorePermissions(permissions);
      const record = { employeeId: node.refId, title: node.title, titleManual: true, permissions, score, rank: rankFromScore(score), updatedAt: new Date().toISOString() };
      if (savedIndex >= 0) data.smartPositions[savedIndex] = { ...data.smartPositions[savedIndex], ...record }; else data.smartPositions.push(record);
    }
  });
}

export function createOrgRecord(companyId, record, permissions = {}) {
  updateCompany(companyId, (data) => {
    data.orgTree = data.orgTree || [];
    const order = data.orgTree.filter((node) => !node.parentId).length;
    if (record.type === "station") {
      const id = `st_${Math.random().toString(36).slice(2, 9)}`;
      data.stations.push({ id, name: record.name.trim(), location: record.location.trim(), type: record.stationType.trim(), status: "active", managerId: null, lat: record.lat ?? null, lng: record.lng ?? null, radiusMeters: record.radiusMeters ?? 200, createdAt: new Date().toISOString() });
      data.orgTree.push({ id: `org_station_${id}`, type: "station", refId: id, title: record.stationType.trim() || record.location.trim(), parentId: null, order });
      return;
    }
    const id = `emp_${Math.random().toString(36).slice(2, 9)}`;
    data.employees.push({ id, name: record.name.trim(), email: record.email, role: "employee", stationId: record.stationId || null, phone: "", anonymousId: `ANON-${Math.floor(Math.random() * 1e8).toString(16).toUpperCase().padStart(8, "0")}`, managedStations: [], profile: {}, createdAt: new Date().toISOString() });
    data.orgTree.push({ id: `org_${id}`, type: "employee", refId: id, title: record.title, parentId: null, order });
    const score = scorePermissions(permissions);
    data.smartPositions = data.smartPositions || [];
    data.smartPositions.push({ employeeId: id, title: record.title, titleManual: true, permissions, score, rank: rankFromScore(score), updatedAt: new Date().toISOString() });
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
    let cursor = target;
    while (cursor?.parentId) { if (cursor.parentId === moving.id) return; cursor = nodes.find((node) => node.id === cursor.parentId); }
    const oldParent = moving.parentId || null;
    if (mode === "above") {
      const targetParent = target.parentId || null;
      moving.parentId = targetParent;
      moving.order = target.order;
      target.parentId = moving.id;
      target.order = nodes.filter((node) => node.id !== target.id && node.parentId === moving.id).length;
      renumber(nodes, oldParent);
      renumber(nodes, targetParent);
      renumber(nodes, moving.id);
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
    if (removed.type === "employee") data.complaintEscalationChain = (data.complaintEscalationChain || []).filter((id) => id !== removed.refId);
  });
}