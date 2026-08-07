import { updateCompany } from "@/lib/store";
import { SMART_DEPARTMENTS } from "@/lib/smartPositions";

// Payroll is money and complaints carry protected identities — only the company
// owner may grant those two sections to anyone.
export const OWNER_ONLY_DEPARTMENTS = ["payroll", "complaints"];

export const INHERIT_TEMPLATE_ID = "__inherit__";

// Starting points, not constraints: picking one fills the whole grid, and any
// edit afterwards simply marks the node as customized.
export const BUILT_IN_TEMPLATES = [
  { id: "field", ar: "موظف ميداني", en: "Field employee", permissions: { attendance: "view", safety: "view", performance: "view" } },
  { id: "safety_officer", ar: "مسؤول سلامة", en: "Safety officer", permissions: { safety: "manage", attendance: "view", performance: "view", employees: "view" } },
  { id: "station_manager", ar: "مدير محطة", en: "Station manager", permissions: { attendance: "manage", safety: "manage", performance: "manage", employees: "view", inventory: "view" } },
  { id: "hr_officer", ar: "مسؤول موارد بشرية", en: "HR officer", permissions: { hr: "manage", employees: "manage", attendance: "view", performance: "view" } },
];

export const companyTemplates = (data) => [...BUILT_IN_TEMPLATES, ...(data?.permissionTemplates || [])];
export const templateById = (data, id) => companyTemplates(data).find((template) => template.id === id) || null;
export const templateLabel = (template, ar) => (ar ? template.ar : template.en || template.ar);

export const grantedCount = (permissions = {}) => Object.values(permissions).filter((access) => access && access !== "hidden").length;

export const samePermissions = (a = {}, b = {}) =>
  SMART_DEPARTMENTS.every((department) => (a[department.id] || "hidden") === (b[department.id] || "hidden"));

// Inheritance is one degree down: manage becomes view, view becomes hidden.
const demote = (permissions = {}) =>
  Object.fromEntries(Object.entries(permissions).filter(([, access]) => access === "manage").map(([id]) => [id, "view"]));

export function inheritedPermissions(data, parentNodeId) {
  const nodes = data?.orgTree || [];
  let cursor = nodes.find((node) => node.id === parentNodeId);
  while (cursor && cursor.type !== "employee") cursor = nodes.find((node) => node.id === cursor.parentId);
  if (!cursor) return {};
  const permissions = (data?.smartPositions || []).find((item) => item.employeeId === cursor.refId)?.permissions || {};
  return demote(permissions);
}

export function stationForParentNode(data, parentNodeId) {
  const nodes = data?.orgTree || [];
  let cursor = nodes.find((node) => node.id === parentNodeId);
  while (cursor && cursor.type !== "station") cursor = nodes.find((node) => node.id === cursor.parentId);
  return cursor ? (data?.stations || []).find((station) => station.id === cursor.refId) || null : null;
}

export function stripOwnerOnly(permissions = {}) {
  const next = { ...permissions };
  OWNER_ONLY_DEPARTMENTS.forEach((id) => delete next[id]);
  return next;
}

export function saveCompanyTemplate(companyId, name, permissions) {
  updateCompany(companyId, (data) => {
    data.permissionTemplates = data.permissionTemplates || [];
    const id = `tpl_${Math.random().toString(36).slice(2, 9)}`;
    data.permissionTemplates.push({ id, ar: name, en: name, permissions });
  });
}