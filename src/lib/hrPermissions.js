// Fixed catalog of permissions that can be granted to an HR level.
// Labels are kept here (not the main i18n dict) since they're only used within the HR module.

export const HR_PERMISSIONS = [
  "view_employees",
  "manage_employees",
  "view_reports",
  "manage_leave",
  "view_safety",
  "manage_anonymous_reports",
  "manage_payroll",
];

const LABELS = {
  view_employees: { en: "View Employees", ar: "عرض الموظفين" },
  manage_employees: { en: "Manage Employees", ar: "إدارة الموظفين" },
  view_reports: { en: "View Reports", ar: "عرض التقارير" },
  manage_leave: { en: "Manage Leave Requests", ar: "إدارة طلبات الإجازة" },
  view_safety: { en: "View Safety Records", ar: "عرض سجلات السلامة" },
  manage_anonymous_reports: { en: "Manage Anonymous Reports", ar: "إدارة البلاغات المجهولة" },
  manage_payroll: { en: "Manage Payroll", ar: "إدارة الرواتب" },
};

export function hrPermLabel(key, lang) {
  return LABELS[key]?.[lang] || LABELS[key]?.en || key;
}