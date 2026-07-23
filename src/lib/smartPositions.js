import { updateCompany } from "@/lib/store";

export const SMART_DEPARTMENTS = [
  { id: "complaints", ar: "شكاوى", en: "Complaints", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "safety", ar: "سلامة", en: "Safety", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "payroll", ar: "رواتب", en: "Payroll", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "employees", ar: "موظفين", en: "Employees", badge: "bg-violet-100 text-violet-700 border-violet-200" },
  { id: "performance", ar: "أداء", en: "Performance", badge: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "attendance", ar: "حضور", en: "Attendance", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "hr", ar: "موارد بشرية", en: "Human Resources", badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" },
  { id: "inventory", ar: "مخزن", en: "Inventory", badge: "bg-orange-100 text-orange-700 border-orange-200" },
];

export const rankFromScore = (score) => score >= 13 ? "executive" : score >= 8 ? "manager" : score >= 4 ? "supervisor" : "employee";
export const rankLabel = (rank, ar) => ({ employee: ar ? "موظف" : "Employee", supervisor: ar ? "مشرف" : "Supervisor", manager: ar ? "مدير" : "Manager", executive: ar ? "مدير تنفيذي" : "Executive Director" }[rank]);
export const scorePermissions = (permissions = {}) => Object.values(permissions).reduce((sum, access) => sum + (access === "manage" ? 2 : access === "view" ? 1 : 0), 0);

export function suggestSmartTitle(permissions = {}, ar = false) {
  const has = (...ids) => ids.every((id) => permissions[id]);
  const score = scorePermissions(permissions);
  if (score >= 13) return ar ? "مدير تنفيذي للعمليات" : "Executive Operations Director";
  if (has("payroll", "employees") || has("hr", "employees")) return ar ? "مدير موارد بشرية" : "Human Resources Manager";
  if (has("safety", "attendance")) return ar ? "مشرف عمليات" : "Operations Supervisor";
  if (has("complaints", "performance")) return ar ? "مدير جودة" : "Quality Manager";
  if (has("inventory", "attendance")) return ar ? "مشرف تشغيل" : "Operations Coordinator";
  const first = SMART_DEPARTMENTS.find((department) => permissions[department.id]);
  return first ? `${rankLabel(rankFromScore(score), ar)} ${ar ? first.ar : first.en}` : "";
}

export function saveSmartPosition(companyId, employeeId, title, permissions, titleManual = false) {
  const score = scorePermissions(permissions);
  updateCompany(companyId, (data) => {
    data.smartPositions = data.smartPositions || [];
    const record = { employeeId, title, titleManual, permissions, score, rank: rankFromScore(score), updatedAt: new Date().toISOString() };
    const index = data.smartPositions.findIndex((item) => item.employeeId === employeeId);
    if (index >= 0) data.smartPositions[index] = record; else data.smartPositions.push(record);
  });
}