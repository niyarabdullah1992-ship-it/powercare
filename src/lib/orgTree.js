import { updateCompany } from "@/lib/store";
import { rankFromScore, scorePermissions } from "@/lib/smartPositions";

export const orgTreeNodes = (data) => Array.isArray(data?.orgTree) ? data.orgTree : [];
export const nodeAccess = (data, refId) => data?.smartPositions?.find((item) => item.employeeId === refId)?.permissions || {};

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

export function moveOrgNode(companyId, nodeId, targetId, mode) {
  updateCompany(companyId, (data) => {
    const nodes = data.orgTree || [];
    const moving = nodes.find((node) => node.id === nodeId);
    const target = nodes.find((node) => node.id === targetId);
    if (!moving || !target || moving.id === target.id) return;
    let cursor = target;
    while (cursor?.parentId) { if (cursor.parentId === moving.id) return; cursor = nodes.find((node) => node.id === cursor.parentId); }
    const oldParent = moving.parentId || null;
    const newParent = mode === "child" ? target.id : target.parentId || null;
    moving.parentId = newParent;
    const siblings = nodes.filter((node) => node.id !== moving.id && (node.parentId || null) === newParent).sort((a, b) => a.order - b.order);
    const targetIndex = siblings.findIndex((node) => node.id === target.id);
    moving.order = mode === "child" ? siblings.length : Math.max(0, targetIndex + (mode === "after" ? 1 : 0));
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