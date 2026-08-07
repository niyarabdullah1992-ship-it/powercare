// Thin client for the invites + job catalog backend gateways.
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { isCompanyOwner, hasHRPermission } from "@/lib/permissions";

const call = async (fn, payload) => {
  const res = await base44.functions.invoke(fn, payload);
  return res?.data;
};
const withAuth = (companyId, extra) => ({ companyId, sessionToken: getCompanyToken(companyId), ...extra });

export const invitesApi = {
  list: (companyId) => call("employeeInvites", withAuth(companyId, { action: "list" })),
  create: (companyId, fields) => call("employeeInvites", withAuth(companyId, { action: "create", appUrl: window.location.origin, ...fields })),
  revoke: (companyId, inviteId) => call("employeeInvites", withAuth(companyId, { action: "revoke", inviteId })),
  approve: (companyId, inviteId, employeeId, seatId) => call("employeeInvites", withAuth(companyId, { action: "approve", inviteId, employeeId, seatId })),
  accept: (companyId, token, email, password) => call("employeeInvites", { action: "accept", companyId, token, email, password }),
};

export const catalogApi = {
  get: (companyId) => call("jobCatalog", withAuth(companyId, { action: "get" })),
  saveTitle: (companyId, title) => call("jobCatalog", withAuth(companyId, { action: "saveTitle", title })),
  deleteTitle: (companyId, titleId) => call("jobCatalog", withAuth(companyId, { action: "deleteTitle", titleId })),
  saveSeat: (companyId, seat) => call("jobCatalog", withAuth(companyId, { action: "saveSeat", seat })),
  deleteSeat: (companyId, seatId) => call("jobCatalog", withAuth(companyId, { action: "deleteSeat", seatId })),
  assignSeat: (companyId, seatId, employeeId) => call("jobCatalog", withAuth(companyId, { action: "assignSeat", seatId, employeeId })),
  unassignSeat: (companyId, seatId, employeeId) => call("jobCatalog", withAuth(companyId, { action: "unassignSeat", seatId, employeeId })),
};

// السلالم الوظيفية المعتمدة وقواعد درجاتها.
export const LADDERS = [
  { id: "general", ar: "السلم العام", en: "General ladder", grades: [...Array.from({ length: 15 }, (_, i) => `المرتبة ${i + 1}`), "المرتبة الممتازة"] },
  { id: "technical", ar: "التشغيل الفني", en: "Technical", grades: Array.from({ length: 10 }, (_, i) => `ف${i + 1}`) },
  { id: "health", ar: "السلم الصحي", en: "Health", grades: Array.from({ length: 9 }, (_, i) => `ص${i + 1}`) },
  { id: "contract", ar: "بند الأجور", en: "Wage-item contract", grades: [] },
];
export const ladderLabel = (id, lang = "ar") => {
  const ladder = LADDERS.find((l) => l.id === id);
  return ladder ? (lang === "ar" ? ladder.ar : ladder.en) : id || "—";
};

// كتالوج المسميات والدعوات: مالك الحساب، المدير العام، وموظفو الموارد البشرية المخوّلون فقط.
export function canManageJobCatalog(user, data) {
  if (!user) return false;
  return isCompanyOwner(user, data) || user.role === "director" || hasHRPermission(user, data, "manage_employees");
}

export const seatVacancy = (seat) => Math.max(0, (Number(seat.approvedCount) || 0) - (seat.assignedEmployeeIds || []).length);