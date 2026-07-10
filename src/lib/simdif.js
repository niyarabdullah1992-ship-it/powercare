// SimDif — flexible, drag-and-drop HR org tree. Each node is a position (Site HR,
// Cluster Manager, Head of HR, VP, CHRO, ...) with a scope and an optional parent
// node, forming a free-form reporting tree instead of a fixed tier ladder.

export function getHRNodeForEmployee(data, employeeId) {
  return (data?.hrNodes || []).find((n) => n.employeeId === employeeId) || null;
}

// The employee occupying the immediate parent node of this employee's node, if any.
export function getParentManager(data, employeeId) {
  const node = getHRNodeForEmployee(data, employeeId);
  if (!node || !node.parentId) return null;
  const parentNode = (data.hrNodes || []).find((n) => n.id === node.parentId);
  if (!parentNode || !parentNode.employeeId) return null;
  return (data.employees || []).find((e) => e.id === parentNode.employeeId) || null;
}

// True if managerEmployeeId occupies any ancestor node above targetEmployeeId's node.
export function isAncestorManager(data, managerEmployeeId, targetEmployeeId) {
  let node = getHRNodeForEmployee(data, targetEmployeeId);
  const visited = new Set();
  while (node && node.parentId && !visited.has(node.id)) {
    visited.add(node.id);
    const parentNode = (data.hrNodes || []).find((n) => n.id === node.parentId);
    if (!parentNode) return false;
    if (parentNode.employeeId === managerEmployeeId) return true;
    node = parentNode;
  }
  return false;
}

// Top-of-tree global/HQ nodes (no parent, company-wide scope) — the final authority.
export function getHQRootNodes(data) {
  return (data?.hrNodes || []).filter((n) => n.scope === "global" && !n.parentId);
}

// Ordered chain of nodes relevant to a station, from the most specific (station-level)
// up to the root of the tree — used to drive anonymous report escalation.
export function getEscalationChainForStation(data, stationId) {
  const nodes = data?.hrNodes || [];
  let node = nodes.find((n) => n.scope === "station" && n.scopeTargetId === stationId);
  if (!node) {
    const cluster = (data?.hrClusters || []).find((c) => (c.stationIds || []).includes(stationId));
    if (cluster) node = nodes.find((n) => n.scope === "cluster" && n.scopeTargetId === cluster.id);
  }
  const chain = [];
  const visited = new Set();
  while (node && !visited.has(node.id)) {
    chain.push(node);
    visited.add(node.id);
    node = nodes.find((n) => n.id === node.parentId) || null;
  }
  return chain;
}

// Only an ancestor manager in the active SimDif path (or an existing full admin) may
// adjust an employee's leave balances.
export function canAdjustLeaveBalance(user, data, employeeId) {
  return isAncestorManager(data, user.id, employeeId);
}