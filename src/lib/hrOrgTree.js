import { updateCompany } from "@/lib/store";

const key = (item) => item.id || item.employeeId;
const siblings = (nodes, parentId) => nodes.filter((node) => (node.parentId || null) === (parentId || null)).sort((a, b) => a.order - b.order);
const renumber = (nodes, parentId) => siblings(nodes, parentId).forEach((node, index) => { node.order = index; });
const levelFor = (data, employeeId) => data.hrLevels?.find((level) => level.id === data.employees?.find((employee) => key(employee) === employeeId)?.hrLevelId);

export function suggestHRRole(parentNode, nodes, levels, employees = []) {
  const active = (levels || []).filter((level) => level.active !== false);
  if (parentNode?.type === "employee") {
    const parent = employees.find((employee) => key(employee) === parentNode.refId);
    const parentLevel = active.find((level) => level.id === parent?.hrLevelId);
    return active.find((level) => level.role === "assistant" && level.order === parentLevel?.order)
      || active.find((level) => level.role === "assistant" && level.scope === parentLevel?.scope)
      || active.find((level) => level.role === "assistant");
  }
  if (parentNode?.type === "station") return active.find((level) => level.scope === "station" && level.role === "manager") || active.find((level) => level.role === "manager");
  return active.find((level) => level.scope === "cluster" && level.role === "manager")
    || active.find((level) => level.scope === "company" && level.role === "manager")
    || active.find((level) => level.role === "manager");
}

function relationScope(data, node) {
  const nodes = data.hrOrgTree || [];
  let cursor = node;
  while (cursor?.parentId) {
    cursor = nodes.find((item) => item.id === cursor.parentId);
    if (cursor?.type === "station") return { stationId: cursor.refId, clusterId: null, stationIds: [cursor.refId] };
    if (cursor?.type === "cluster") {
      const cluster = data.hrClusters?.find((item) => item.id === cursor.refId);
      return { stationId: null, clusterId: cursor.refId, stationIds: cluster?.stationIds || [] };
    }
    if (cursor?.type === "employee") {
      const manager = data.employees?.find((employee) => key(employee) === cursor.refId);
      if (manager) return { stationId: manager.hrStationId || null, clusterId: manager.hrClusterId || null, stationIds: manager.managedStations || [] };
    }
  }
  const childCluster = nodes.find((item) => item.parentId === node.id && item.type === "cluster");
  if (childCluster) {
    const cluster = data.hrClusters?.find((item) => item.id === childCluster.refId);
    return { stationId: null, clusterId: childCluster.refId, stationIds: cluster?.stationIds || [] };
  }
  return { stationId: null, clusterId: null, stationIds: [] };
}

function syncEmployee(data, node, preferredLevel) {
  if (node?.type !== "employee") return;
  const employee = data.employees?.find((item) => key(item) === node.refId);
  if (!employee) return;
  const parent = data.hrOrgTree?.find((item) => item.id === node.parentId);
  const level = preferredLevel || suggestHRRole(parent, data.hrOrgTree, data.hrLevels, data.employees);
  const scope = relationScope(data, node);
  if (level) employee.hrLevelId = level.id;
  employee.hrStationId = scope.stationId;
  employee.hrClusterId = scope.clusterId;
  employee.managedStations = scope.stationIds;
}

export function initializeHROrgTree(companyId, source) {
  const existing = Array.isArray(source?.hrOrgTree) ? source.hrOrgTree : [];
  const validLevelIds = new Set((source?.hrLevels || []).map((level) => level.id));
  const wanted = new Set([
    ...(source?.stations || []).map((station) => `station:${key(station)}`),
    ...(source?.hrClusters || []).map((cluster) => `cluster:${cluster.id}`),
    ...(source?.employees || []).filter((employee) => validLevelIds.has(employee.hrLevelId)).map((employee) => `employee:${key(employee)}`),
  ]);
  const current = new Set(existing.map((node) => `${node.type}:${node.refId}`));
  const stale = existing.some((node) => !wanted.has(`${node.type}:${node.refId}`));
  const missing = [...wanted].some((item) => !current.has(item));
  const hierarchyMismatch = (source?.stations || []).some((station) => {
    const node = existing.find((item) => item.type === "station" && item.refId === key(station));
    const cluster = (source?.hrClusters || []).find((item) => (item.stationIds || []).includes(key(station)));
    return node && (node.parentId || null) !== (cluster ? `hr_cluster_${cluster.id}` : null);
  });
  if (!stale && !missing && !hierarchyMismatch && Array.isArray(source?.hrOrgTree)) return;
  updateCompany(companyId, (data) => {
    const kept = (data.hrOrgTree || []).filter((node) => wanted.has(`${node.type}:${node.refId}`));
    const byRef = new Map(kept.map((node) => [`${node.type}:${node.refId}`, node]));
    (data.hrClusters || []).forEach((cluster, order) => { if (!byRef.has(`cluster:${cluster.id}`)) kept.push({ id: `hr_cluster_${cluster.id}`, type: "cluster", refId: cluster.id, parentId: null, order }); });
    (data.stations || []).forEach((station, order) => {
      const cluster = (data.hrClusters || []).find((item) => (item.stationIds || []).includes(key(station)));
      const existingNode = byRef.get(`station:${key(station)}`);
      if (existingNode) { existingNode.parentId = cluster ? `hr_cluster_${cluster.id}` : null; return; }
      kept.push({ id: `hr_station_${key(station)}`, type: "station", refId: key(station), parentId: cluster ? `hr_cluster_${cluster.id}` : null, order });
    });
    (data.employees || []).filter((employee) => validLevelIds.has(employee.hrLevelId)).forEach((employee, order) => {
      if (kept.some((node) => node.type === "employee" && node.refId === key(employee))) return;
      const stationParent = employee.hrStationId && kept.find((node) => node.type === "station" && node.refId === employee.hrStationId);
      const clusterParent = employee.hrClusterId && kept.find((node) => node.type === "cluster" && node.refId === employee.hrClusterId);
      kept.push({ id: `hr_employee_${key(employee)}`, type: "employee", refId: key(employee), parentId: stationParent?.id || clusterParent?.id || null, order });
    });
    data.hrOrgTree = kept;
  });
}

export function moveHROrgNode(companyId, nodeId, targetId, mode) {
  updateCompany(companyId, (data) => {
    const nodes = data.hrOrgTree || [];
    const moving = nodes.find((node) => node.id === nodeId);
    const target = nodes.find((node) => node.id === targetId);
    if (!moving || !target || moving.id === target.id || moving.type !== "employee") return;
    let cursor = target;
    while (cursor?.parentId) { if (cursor.parentId === moving.id) return; cursor = nodes.find((node) => node.id === cursor.parentId); }
    const oldParent = moving.parentId || null;
    if (mode === "above") {
      moving.parentId = target.parentId || null;
      moving.order = target.order;
      target.parentId = moving.id;
      target.order = 0;
    } else {
      moving.parentId = mode === "inside" || mode === "below" ? target.id : target.parentId || null;
      moving.order = siblings(nodes, moving.parentId).filter((node) => node.id !== moving.id).length;
    }
    renumber(nodes, oldParent); renumber(nodes, moving.parentId); renumber(nodes, moving.id);
    const suggestionTarget = mode === "above" ? target : nodes.find((node) => node.id === moving.parentId);
    syncEmployee(data, moving, suggestHRRole(suggestionTarget, nodes, data.hrLevels, data.employees));
    nodes.filter((node) => node.type === "employee" && node.parentId === moving.id).forEach((node) => syncEmployee(data, node));
  });
}

export function assignHRTreeEmployee(companyId, employeeId, targetId) {
  updateCompany(companyId, (data) => {
    data.hrOrgTree = data.hrOrgTree || [];
    const target = data.hrOrgTree.find((node) => node.id === targetId);
    const employee = data.employees?.find((item) => key(item) === employeeId);
    if (!target || !employee) return;
    let node = data.hrOrgTree.find((item) => item.type === "employee" && item.refId === employeeId);
    if (!node) { node = { id: `hr_employee_${employeeId}`, type: "employee", refId: employeeId, parentId: targetId, order: siblings(data.hrOrgTree, targetId).length }; data.hrOrgTree.push(node); }
    else { node.parentId = targetId; node.order = siblings(data.hrOrgTree, targetId).filter((item) => item.id !== node.id).length; }
    syncEmployee(data, node);
  });
}

export function unassignHRTreeEmployee(companyId, nodeId) {
  updateCompany(companyId, (data) => {
    const nodes = data.hrOrgTree || [];
    const node = nodes.find((item) => item.id === nodeId && item.type === "employee");
    if (!node || nodes.some((item) => item.parentId === node.id)) return;
    const oldParent = node.parentId || null;
    node.parentId = null; node.order = siblings(nodes, null).length;
    const employee = data.employees?.find((item) => key(item) === node.refId);
    if (employee) { employee.hrStationId = null; employee.hrClusterId = null; employee.managedStations = []; }
    renumber(nodes, oldParent); renumber(nodes, null);
  });
}

export function setHRTreeRole(companyId, employeeId, levelId) {
  updateCompany(companyId, (data) => {
    const employee = data.employees?.find((item) => key(item) === employeeId);
    const node = data.hrOrgTree?.find((item) => item.type === "employee" && item.refId === employeeId);
    const level = data.hrLevels?.find((item) => item.id === levelId);
    if (!employee || !node || !level) return;
    employee.hrLevelId = level.id;
    syncEmployee(data, node, level);
  });
}