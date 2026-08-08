// Single source of truth for which sections each role can see —
// used by the sidebar/mobile nav and the dashboards' quick-access shortcuts.

const BASE = ["/app", "/app/daily-report", "/app/tasks", "/app/attendance", "/app/chat", "/app/files", "/app/inventory", "/app/expenses", "/app/work-proof", "/app/signing", "/app/assistant", "/app/complaints", "/app/performance", "/app/employees", "/app/manual"];
const MANAGER_EXTRA = ["/app/safety"];
const EXEC_EXTRA = ["/app/hr", "/app/payroll"];
const SMART_SECTION_ROUTES = {
  complaints: "/app/complaints", safety: "/app/safety", payroll: "/app/payroll",
  performance: "/app/performance", attendance: "/app/attendance",
  hr: "/app/hr", inventory: "/app/inventory",
};
const PLAN_ROUTE_SECTIONS = {
  "/app/assistant": "assistant", "/app/daily-report": "reports", "/app/tasks": "tasks",
  "/app/inventory": "inventory", "/app/attendance": "attendance", "/app/hr": "hr",
  "/app/performance": "performance", "/app/expenses": "expenses", "/app/payroll": "payroll",
  "/app/safety": "safety", "/app/complaints": "complaints", "/app/files": "files",
  "/app/signing": "signing", "/app/chat": "chat",
};

const routeSection = (pathname) => Object.entries(PLAN_ROUTE_SECTIONS).find(([route]) => pathname === route || pathname.startsWith(route + "/"))?.[1];
export function canUsePlanFeature(company, feature) { return (company?.planConfig?.enabledFeatures || []).includes(feature); }
export function canAccessPlanPath(pathname, company) {
  const section = routeSection(pathname);
  if (!section) return true;
  if (!(company?.planConfig?.enabledSections || []).includes(section)) return false;
  if (section === "assistant" && !canUsePlanFeature(company, "ai")) return false;
  if (section === "signing" && !canUsePlanFeature(company, "signing")) return false;
  return true;
}

export function allowedNavFor(user, data, company) {
  if (!user) return new Set(BASE);
  const allowed = new Set(BASE);
  const role = user.role;
  const hrLevel = user.hrLevelId && Array.isArray(data?.hrLevels) ? data.hrLevels.find((level) => level.id === user.hrLevelId) : null;
  const hrPermissions = new Set(hrLevel?.permissions || []);
  if (["station_manager", "pgm", "ops_manager", "director"].includes(role) || user.id === data?.ownerId) {
    MANAGER_EXTRA.forEach((p) => allowed.add(p));
  }
  if (["employee", "safety_officer"].includes(role)) allowed.add("/app/safety");
  if (["ops_manager", "director"].includes(role)) {
    EXEC_EXTRA.forEach((p) => allowed.add(p));
  }
  if (role === "pgm") allowed.add("/app/payroll");
  // Employees holding an HR position access workforce management through HR.
  if (user.hrLevelId) {
    allowed.add("/app/hr");
    if (hrPermissions.has("view_safety")) allowed.add("/app/safety");
    if (hrPermissions.has("manage_payroll")) allowed.add("/app/payroll");
  }
  const smartPosition = (data?.smartPositions || []).find((position) => position.employeeId === user.id);
  if (smartPosition && user.id !== data?.ownerId) {
    Object.entries(SMART_SECTION_ROUTES).forEach(([department, route]) => {
      if (!smartPosition.permissions?.[department]) allowed.delete(route);
    });
  }
  [...allowed].forEach((route) => { if (!canAccessPlanPath(route, company)) allowed.delete(route); });
  return allowed;
}

export function canAccessPath(pathname, user, data, company) {
  if (!canAccessPlanPath(pathname, company)) return false;
  const route = Object.values(SMART_SECTION_ROUTES).find((item) => pathname === item || pathname.startsWith(item + "/"));
  return !route || allowedNavFor(user, data, company).has(route);
}