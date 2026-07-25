import { updateCompany } from "@/lib/store";

const renumber = (nodes, parentId) => nodes.filter((node) => (node.parentId || null) === (parentId || null)).sort((a, b) => a.order - b.order).forEach((node, index) => { node.order = index; });

export function initializeHROrgTree(companyId, data) {
  if (Array.isArray(data?.hrOrgTree) && data.hrOrgTree.length) return;
  const general = data?.orgTree || [];
  const department = general.find((node) => node.type === "department" && node.refId === "hr");
  const included = new Set();
  let frontier = department ? [department.id] : [];
  while (frontier.length) {
    const parents = new Set(frontier);
    frontier = general.filter((node) => parents.has(node.parentId) && !included.has(node.id)).map((node) => { included.add(node.id); return node.id; });
  }
  const migrated = general.filter((node) => included.has(node.id)).map((node) => ({ ...node, parentId: node.parentId === department?.id ? null : node.parentId }));
  const existingEmployees = new Set(migrated.filter((node) => node.type === "employee").map((node) => node.refId));
  const missing = (data?.employees || []).filter((employee) => employee.hrLevelId && !existingEmployees.has(employee.id));
  if (Array.isArray(data?.hrOrgTree) && !migrated.length && !missing.length) return;
  updateCompany(companyId, (draft) => {
    draft.hrOrgTree = [...migrated, ...missing.map((employee, order) => ({ id: `hr_org_${employee.id}`, type: "employee", refId: employee.id, title: employee.position || "HR", parentId: null, order: migrated.length + order }))];
  });
}

export function moveHROrgNode(companyId, nodeId, targetId, mode) {
  updateCompany(companyId, (data) => {
    const nodes = data.hrOrgTree || [];
    const moving = nodes.find((node) => node.id === nodeId);
    const target = nodes.find((node) => node.id === targetId);
    if (!moving || !target || moving.id === target.id) return;
    let cursor = target;
    while (cursor?.parentId) {
      if (cursor.parentId === moving.id) return;
      cursor = nodes.find((node) => node.id === cursor.parentId);
    }
    const oldParent = moving.parentId || null;
    if (mode === "above") {
      moving.parentId = target.parentId || null;
      moving.order = target.order;
      target.parentId = moving.id;
      target.order = 0;
    } else {
      const parentId = mode === "below" || mode === "inside" ? target.id : target.parentId || null;
      moving.parentId = parentId;
      const siblings = nodes.filter((node) => node.id !== moving.id && (node.parentId || null) === parentId).sort((a, b) => a.order - b.order);
      const targetIndex = siblings.findIndex((node) => node.id === target.id);
      moving.order = mode === "below" || mode === "inside" ? siblings.length : Math.max(0, targetIndex + (mode === "right" ? 1 : 0));
    }
    renumber(nodes, oldParent);
    renumber(nodes, moving.parentId);
  });
}

export function placeEmployeeInHROrgTree(companyId, employeeId, targetId) {
  updateCompany(companyId, (data) => {
    const nodes = data.hrOrgTree || (data.hrOrgTree = []);
    let node = nodes.find((item) => item.type === "employee" && item.refId === employeeId);
    if (!node) {
      const employee = (data.employees || []).find((item) => item.id === employeeId);
      if (!employee) return;
      node = { id: `hr_org_${employeeId}`, type: "employee", refId: employeeId, title: employee.position || "HR", parentId: null, order: nodes.length };
      nodes.push(node);
    }
    node.parentId = targetId || null;
    renumber(nodes, node.parentId);
  });
}

export function unassignHROrgNode(companyId, nodeId) {
  updateCompany(companyId, (data) => {
    const nodes = data.hrOrgTree || [];
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const oldParent = node.parentId || null;
    node.parentId = null;
    renumber(nodes, oldParent);
    renumber(nodes, null);
  });
}

export function saveHROrgNode(companyId, node) {
  updateCompany(companyId, (data) => {
    const nodes = data.hrOrgTree || (data.hrOrgTree = []);
    const index = nodes.findIndex((item) => item.id === node.id);
    if (index >= 0) nodes[index] = node; else nodes.push(node);
    renumber(nodes, node.parentId);
  });
}

export function createHROrgEmployee(companyId, record) {
  updateCompany(companyId, (data) => {
    const id = `emp_${Math.random().toString(36).slice(2, 9)}`;
    data.employees.push({ id, name: record.name.trim(), email: record.email, role: "hr", stationId: record.stationId || null, phone: "", anonymousId: `ANON-${Math.floor(Math.random() * 1e8).toString(16).toUpperCase().padStart(8, "0")}`, managedStations: [], profile: { position: record.title }, createdAt: new Date().toISOString() });
    const nodes = data.hrOrgTree || (data.hrOrgTree = []);
    nodes.push({ id: `hr_org_${id}`, type: "employee", refId: id, title: record.title, parentId: record.parentId || null, order: nodes.filter((node) => (node.parentId || null) === (record.parentId || null)).length });
  });
  return null;
}

export function deleteHROrgNode(companyId, nodeId) {
  updateCompany(companyId, (data) => {
    const nodes = data.hrOrgTree || [];
    const removed = nodes.find((node) => node.id === nodeId);
    if (!removed) return;
    nodes.filter((node) => node.parentId === nodeId).forEach((node) => { node.parentId = removed.parentId || null; });
    data.hrOrgTree = nodes.filter((node) => node.id !== nodeId);
    renumber(data.hrOrgTree, removed.parentId);
  });
}