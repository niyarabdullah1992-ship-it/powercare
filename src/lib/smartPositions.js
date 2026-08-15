import { updateCompany } from "@/lib/store";
import { ORG_TO_SMART_SECTION, canonicalSectionId, titleSlug } from "@/lib/orgDerivations";

/**
 * Grantable product sections — aligned with Layout sidebar labels & routes.
 */
export const SMART_DEPARTMENTS = [
  // Proof cycle — matches Layout category "daily"
  {
    id: "command",
    ar: "مركز القيادة",
    en: "Command Center",
    hintAr: "نظرة القرار اليومية",
    hintEn: "Daily decision glance",
    group: "daily",
  },
  {
    id: "attendance",
    ar: "الحضور والانصراف",
    en: "Attendance",
    hintAr: "تسجيل الحضور والانصراف",
    hintEn: "Check-in and check-out",
    group: "daily",
  },
  {
    id: "shifts",
    ar: "الورديات",
    en: "Shifts",
    hintAr: "جداول الدوام والنشر",
    hintEn: "Rota and publication",
    group: "workforce",
  },
  {
    id: "leave",
    ar: "طلبات الإجازة",
    en: "Leave requests",
    hintAr: "طلب واعتماد الإجازة",
    hintEn: "Request and approve leave",
    group: "workforce",
  },
  {
    id: "tasks",
    ar: "المهام والعمليات",
    en: "Operations",
    hintAr: "تنفيذ ومراجعة وتصعيد المهام",
    hintEn: "Task execution, review, and escalation",
    group: "daily",
  },
  {
    id: "work_proof",
    ar: "إثبات العمل",
    en: "Work proof",
    hintAr: "أدلة ميدانية وإثبات للعميل",
    hintEn: "Field evidence and client proof",
    group: "daily",
  },
  {
    id: "signing",
    ar: "التوقيع الرقمي",
    en: "Digital signing",
    hintAr: "ختم واعتماد المستندات",
    hintEn: "Document stamp and approval",
    group: "daily",
  },
  {
    id: "daily_report",
    ar: "التقرير اليومي",
    en: "Daily report",
    hintAr: "ملخص تشغيل اليوم",
    hintEn: "Day operations summary",
    group: "daily",
  },
  {
    id: "chat",
    ar: "المحادثات التشغيلية",
    en: "Operations chat",
    hintAr: "تواصل الفرق في الفرع",
    hintEn: "Team communication",
    group: "daily",
  },
  // Workforce
  {
    id: "performance",
    ar: "الأداء",
    en: "Performance",
    hintAr: "مؤشرات وإثبات الجهد",
    hintEn: "Metrics and effort proof",
    group: "workforce",
  },
  {
    id: "hr",
    ar: "الموارد البشرية",
    en: "Human resources",
    hintAr: "الدليل والملف",
    hintEn: "Directory and file",
    group: "workforce",
  },
  {
    id: "org",
    ar: "الهيكل التنظيمي",
    en: "Org structure",
    hintAr: "قائمة ثم تعيين",
    hintEn: "List, then assign",
    group: "workforce",
  },
  {
    id: "settings",
    ar: "إعدادات الشركة",
    en: "Company settings",
    hintAr: "الهوية والنطاق الجغرافي",
    hintEn: "Identity and geofence",
    group: "admin",
  },
  {
    id: "hiring",
    ar: "التوظيف",
    en: "Recruitment",
    hintAr: "مسارات التعيين",
    hintEn: "Hiring pipelines",
    group: "workforce",
  },
  // Care & compliance
  {
    id: "safety",
    ar: "السلامة HSE",
    en: "Safety HSE",
    hintAr: "ملاحظات ومخاطر الفرع",
    hintEn: "Hazards and site notes",
    group: "compliance",
  },
  {
    id: "complaints",
    ar: "صوت الموظف",
    en: "Employee Voice",
    hintAr: "للمالك فقط منحه",
    hintEn: "Owner grants only",
    group: "compliance",
    ownerOnly: true,
  },
  // Money
  {
    id: "expenses",
    ar: "المصروفات",
    en: "Expenses",
    hintAr: "مطالبات ومصاريف الفرع",
    hintEn: "Branch claims and spend",
    group: "money",
  },
  {
    id: "inventory",
    ar: "المخزون والأصول",
    en: "Inventory & assets",
    hintAr: "صرف وطلبات الفرع",
    hintEn: "Branch stock and requests",
    group: "money",
  },
  {
    id: "payroll",
    ar: "الرواتب",
    en: "Payroll",
    hintAr: "للمالك فقط منحه",
    hintEn: "Owner grants only",
    group: "money",
    ownerOnly: true,
  },
  // Admin
  {
    id: "reports",
    ar: "التقارير والتحليلات",
    en: "Reports & analytics",
    hintAr: "لوحات ومتابعة",
    hintEn: "Dashboards and tracking",
    group: "admin",
  },
  {
    id: "files",
    ar: "الملفات",
    en: "Files",
    hintAr: "مستندات الشركة",
    hintEn: "Company documents",
    group: "admin",
  },
  {
    id: "assistant",
    ar: "المساعد الذكي",
    en: "AI assistant",
    hintAr: "أسئلة ضمن الصلاحيات",
    hintEn: "Ask within permissions",
    group: "admin",
  },
];

export const SMART_SECTION_GROUPS = [
  { id: "daily", ar: "دورة الإثبات", en: "Proof cycle" },
  { id: "workforce", ar: "القوى العاملة", en: "Workforce" },
  { id: "compliance", ar: "الالتزام والرعاية", en: "Care & compliance" },
  { id: "money", ar: "المال والأصول", en: "Money & assets" },
  { id: "admin", ar: "المؤسسة", en: "Institution" },
];

/** Grantable sections — command stays on /app for everyone and is not a fake grant. */
export const GRANTABLE_DEPARTMENTS = SMART_DEPARTMENTS.filter((department) => department.id !== "command");

/** department id → routes removed when not granted (after owner composed access). */
export const SMART_SECTION_ROUTES = {
  command: [],
  tasks: ["/app/tasks"],
  attendance: ["/app/attendance"],
  shifts: ["/app/shifts"],
  leave: ["/app/leave"],
  daily_report: ["/app/daily-report"],
  chat: ["/app/chat"],
  performance: ["/app/performance"],
  hr: ["/app/hr"],
  org: ["/app/org"],
  settings: ["/app/settings"],
  hiring: ["/app/hiring"],
  safety: ["/app/safety"],
  work_proof: ["/app/work-proof", "/app/client-proof"],
  signing: ["/app/signing"],
  complaints: ["/app/complaints"],
  expenses: ["/app/expenses"],
  inventory: ["/app/inventory"],
  payroll: ["/app/payroll"],
  reports: ["/app/reports"],
  files: ["/app/files"],
  assistant: ["/app/assistant"],
};

export const rankFromScore = (score) => (score >= 13 ? "executive" : score >= 8 ? "manager" : score >= 4 ? "supervisor" : "employee");
export const rankLabel = (rank, ar) => ({
  employee: ar ? "موظف" : "Employee",
  supervisor: ar ? "مشرف" : "Supervisor",
  manager: ar ? "مدير" : "Manager",
  executive: ar ? "مدير تنفيذي" : "Executive Director",
}[rank]);
export const scorePermissions = (permissions = {}) => Object.values(permissions).reduce((sum, access) => sum + (access === "manage" ? 2 : access === "view" || access === "station" || access === "own" ? 1 : 0), 0);

export function suggestSmartTitle(permissions = {}, ar = false) {
  const has = (...ids) => ids.every((id) => permissions[id]);
  const score = scorePermissions(permissions);
  if (score >= 13) return ar ? "مدير تنفيذي للعمليات" : "Executive Operations Director";
  if (has("payroll", "employees") || has("hr", "employees")) return ar ? "مدير موارد بشرية" : "Human Resources Manager";
  if (has("expenses") || has("payroll")) return ar ? "مسؤول مالية" : "Finance officer";
  if (has("safety", "attendance")) return ar ? "مشرف عمليات" : "Operations Supervisor";
  if (has("complaints", "performance")) return ar ? "مدير جودة" : "Quality Manager";
  if (has("inventory", "attendance")) return ar ? "مشرف تشغيل" : "Operations Coordinator";
  const first = SMART_DEPARTMENTS.find((department) => permissions[department.id]);
  return first ? `${rankLabel(rankFromScore(score), ar)} ${ar ? first.ar : first.en}` : "";
}

export function personJobTitle(employee, position) {
  return String(
    position?.title
    || employee?.profile?.position
    || employee?.position
    || employee?.jobTitle
    || employee?.title
    || "",
  ).trim();
}

export function sectionAccess(permissions = {}, departmentId) {
  const id = canonicalSectionId(departmentId);
  let raw = permissions[id] || permissions[departmentId];
  if (!raw) {
    for (const [legacy, smart] of Object.entries(ORG_TO_SMART_SECTION)) {
      if (smart === id && permissions[legacy]) raw = permissions[legacy];
    }
  }
  return raw && raw !== "hidden" ? raw : "";
}

export function hasSmartAccess(user, data, departmentId, min = "view") {
  if (!user?.id) return false;
  if (user.id === data?.ownerId) return true;
  const position = (data?.smartPositions || []).find((item) => item.employeeId === user.id);
  const access = sectionAccess(position?.permissions, departmentId);
  if (!access) return false;
  const rank = { own: 1, station: 2, view: 3, manage: 4 };
  return (rank[access] || 0) >= (rank[min] || 3);
}

function employeesMatchingTitle(data, titleLabel) {
  const want = titleSlug(titleLabel);
  if (!want) return [];
  return (data.employees || []).filter((employee) => {
    if (employee.id === data.ownerId) return false;
    const position = (data.smartPositions || []).find((item) => item.employeeId === employee.id);
    return titleSlug(personJobTitle(employee, position)) === want;
  });
}

export function titleSectionAccess(data, titleLabel, departmentId) {
  const accesses = employeesMatchingTitle(data, titleLabel).map((employee) => {
    const position = (data.smartPositions || []).find((item) => item.employeeId === employee.id);
    return sectionAccess(position?.permissions, departmentId) || "hidden";
  });
  if (!accesses.length) return "hidden";
  const first = accesses[0];
  return accesses.every((access) => access === first) ? first : "mixed";
}

function writePositionRecord(data, employeeId, title, permissions) {
  data.smartPositions = data.smartPositions || [];
  const index = data.smartPositions.findIndex((item) => item.employeeId === employeeId);
  const hasGrants = Object.values(permissions || {}).some((access) => access && access !== "hidden");
  const employee = (data.employees || []).find((item) => item.id === employeeId);
  if (title && employee) {
    employee.profile = { ...(employee.profile || {}), position: title };
    employee.position = title;
  }
  const node = (data.orgTree || []).find((item) => item.type === "employee" && item.refId === employeeId);
  if (title && node) node.title = title;
  if (!hasGrants) {
    if (index >= 0) data.smartPositions.splice(index, 1);
    return;
  }
  const previous = index >= 0 ? data.smartPositions[index] : null;
  const score = scorePermissions(permissions);
  const record = {
    employeeId,
    title,
    titleManual: Boolean(title),
    permissions,
    score,
    rank: rankFromScore(score),
    manualOrder: previous?.manualOrder,
    updatedAt: new Date().toISOString(),
  };
  if (index >= 0) data.smartPositions[index] = { ...previous, ...record };
  else data.smartPositions.push(record);
}

export function saveSmartPosition(companyId, employeeId, title, permissions, titleManual = false) {
  updateCompany(companyId, (data) => {
    writePositionRecord(data, employeeId, title, permissions);
    const index = (data.smartPositions || []).findIndex((item) => item.employeeId === employeeId);
    if (index >= 0) data.smartPositions[index].titleManual = titleManual;
  });
}

export function applyTitleSectionAccess(companyId, titleLabel, departmentId, access) {
  const dept = canonicalSectionId(departmentId);
  let applied = 0;
  updateCompany(companyId, (data) => {
    const matches = employeesMatchingTitle(data, titleLabel);
    applied = matches.length;
    for (const employee of matches) {
      const previous = (data.smartPositions || []).find((item) => item.employeeId === employee.id);
      const permissions = { ...(previous?.permissions || {}) };
      if (!access || access === "hidden") delete permissions[dept];
      else permissions[dept] = access;
      writePositionRecord(data, employee.id, previous?.title || personJobTitle(employee) || titleLabel, permissions);
    }
  });
  return applied;
}

export function reorderSmartRank(companyId, rank, employeeIds) {
  updateCompany(companyId, (data) => {
    (data.smartPositions || []).forEach((position) => {
      if (position.rank === rank) position.manualOrder = employeeIds.indexOf(position.employeeId);
    });
  });
}
