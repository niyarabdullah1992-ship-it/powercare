import { HR_PERMISSIONS } from "@/lib/hrPermissions";

export const HR_ROLE_TEMPLATES = [
  { id: "attendance", icon: "clock", name: { ar: "مشرف الحضور", en: "Attendance Supervisor" }, permissions: ["view_employees", "view_reports", "manage_leave", "manage_schedules"] },
  { id: "safety", icon: "shield", name: { ar: "مشرف السلامة", en: "Safety Supervisor" }, permissions: ["view_safety", "view_reports", "manage_anonymous_reports", "view_anonymous_reports"] },
  { id: "payroll", icon: "wallet", name: { ar: "مشرف الرواتب", en: "Payroll Supervisor" }, permissions: ["view_employees", "manage_payroll"] },
  { id: "hr-manager", icon: "users", name: { ar: "مدير الموارد البشرية", en: "HR Manager" }, permissions: [...HR_PERMISSIONS] },
  { id: "hr-assistant", icon: "user-check", name: { ar: "مساعد HR", en: "HR Assistant" }, permissions: HR_PERMISSIONS.filter((permission) => permission.startsWith("view_")) },
];