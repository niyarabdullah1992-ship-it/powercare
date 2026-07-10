// Fixed catalog of permissions that can be granted to an HR level.
// Labels are kept here (not the main i18n dict) since they're only used within the HR module.

export const HR_PERMISSIONS = [
  "view_employees",
  "manage_employees",
  "view_reports",
  "manage_leave",
  "view_safety",
  "manage_anonymous_reports",
  "view_anonymous_reports",
  "manage_payroll",
  "manage_schedules",
];

const LABELS = {
  view_employees: { en: "View Employees", ar: "عرض الموظفين" },
  manage_employees: { en: "Manage Employees", ar: "إدارة الموظفين" },
  view_reports: { en: "View Reports", ar: "عرض التقارير" },
  manage_leave: { en: "Manage Leave Requests", ar: "إدارة طلبات الإجازة" },
  view_safety: { en: "View Safety Records", ar: "عرض سجلات السلامة" },
  manage_anonymous_reports: { en: "Manage Anonymous Reports", ar: "إدارة البلاغات المجهولة" },
  view_anonymous_reports: { en: "View & Audit Anonymous Reports", ar: "عرض ومراجعة البلاغات المجهولة" },
  manage_payroll: { en: "Manage Payroll", ar: "إدارة الرواتب" },
  manage_schedules: { en: "Manage Work Schedules", ar: "إدارة جداول الدوام" },
};

const DESCRIPTIONS = {
  view_employees: { en: "Can view the list of employees only, without editing their data.", ar: "يسمح بمشاهدة قائمة الموظفين فقط دون تعديل بياناتهم." },
  manage_employees: { en: "Can add, edit, or remove employees.", ar: "يسمح بإضافة موظفين جدد أو تعديل بياناتهم أو حذفهم." },
  view_reports: { en: "Can view daily station reports.", ar: "يسمح بمشاهدة التقارير اليومية للمحطات." },
  manage_leave: { en: "Can review and approve leave requests.", ar: "يسمح بمراجعة والموافقة على طلبات الإجازة." },
  view_safety: { en: "Can view station safety records, inspections, and hazards.", ar: "يسمح بمشاهدة سجلات السلامة والفحوصات والمخاطر الخاصة بالمحطة." },
  manage_anonymous_reports: { en: "Can approve, reject, and escalate anonymous complaints/suggestions within this HR member's scope.", ar: "يسمح بالموافقة أو الرفض أو التصعيد للبلاغات المجهولة ضمن نطاق مسؤول الموارد البشرية." },
  view_anonymous_reports: { en: "Can view and audit anonymous reports within this HR member's scope, without taking action.", ar: "يسمح بمشاهدة ومراجعة البلاغات المجهولة ضمن النطاق دون اتخاذ أي إجراء." },
  manage_payroll: { en: "Can manage employee payroll.", ar: "يسمح بإدارة رواتب الموظفين." },
  manage_schedules: { en: "Can create and edit station work/shift schedules.", ar: "يسمح بإنشاء وتعديل جداول الدوام والورديات للمحطة." },
};

export function hrPermLabel(key, lang) {
  return LABELS[key]?.[lang] || LABELS[key]?.en || key;
}

export function hrPermDescription(key, lang) {
  return DESCRIPTIONS[key]?.[lang] || DESCRIPTIONS[key]?.en || "";
}