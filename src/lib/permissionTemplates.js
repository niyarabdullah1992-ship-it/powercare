import { updateCompany } from "@/lib/store";
import { SMART_DEPARTMENTS } from "@/lib/smartPositions";

// Payroll and complaints are sensitive — only the company owner may grant them.
export const OWNER_ONLY_DEPARTMENTS = ["payroll", "complaints"];

export const INHERIT_TEMPLATE_ID = "__inherit__";
/** Owner-named position — permissions distributed by section (SAP-style). */
export const CUSTOM_TEMPLATE_ID = "";

const dailyOpsView = {
  tasks: "view",
  attendance: "view",
  daily_report: "view",
  chat: "view",
  performance: "view",
  expenses: "view",
  files: "view",
};

// Examples only: applying one fills the section list; the job title stays free text.
export const BUILT_IN_TEMPLATES = [
  {
    id: "field",
    ar: "موظف ميداني",
    en: "Field employee",
    permissions: { ...dailyOpsView, safety: "view", work_proof: "view" },
  },
  {
    id: "safety_officer",
    ar: "مسؤول سلامة",
    en: "Safety officer",
    permissions: { ...dailyOpsView, safety: "manage", work_proof: "view" },
  },
  {
    id: "station_manager",
    ar: "مدير فرع",
    en: "Branch manager",
    permissions: {
      tasks: "manage",
      attendance: "manage",
      daily_report: "manage",
      chat: "manage",
      performance: "manage",
      safety: "manage",
      inventory: "view",
      expenses: "view",
      work_proof: "view",
      signing: "view",
      reports: "view",
      files: "view",
    },
  },
  {
    id: "finance_officer",
    ar: "مسؤول مالية",
    en: "Finance officer",
    permissions: {
      expenses: "manage",
      payroll: "view",
      inventory: "view",
      attendance: "view",
      reports: "view",
      files: "view",
    },
  },
  {
    id: "hr_officer",
    ar: "مسؤول موارد بشرية",
    en: "HR officer",
    permissions: {
      hr: "manage",
      hiring: "manage",
      attendance: "view",
      performance: "view",
      expenses: "view",
      files: "view",
      reports: "view",
    },
  },
];

export const companyTemplates = (data) => [...BUILT_IN_TEMPLATES, ...(data?.permissionTemplates || [])];
export const templateById = (data, id) => companyTemplates(data).find((template) => template.id === id) || null;
export const templateLabel = (template, ar) => (ar ? template.ar : template.en || template.ar);

export const grantedCount = (permissions = {}) => Object.values(permissions).filter((access) => access && access !== "hidden").length;

export const samePermissions = (a = {}, b = {}) =>
  SMART_DEPARTMENTS.filter((department) => department.id !== "command")
    .every((department) => (a[department.id] || "hidden") === (b[department.id] || "hidden"));

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
