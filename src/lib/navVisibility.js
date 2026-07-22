// Single source of truth for which sections each role can see —
// used by the sidebar/mobile nav and the dashboards' quick-access shortcuts.

const BASE = ["/app", "/app/daily-report", "/app/tasks", "/app/attendance", "/app/chat", "/app/files", "/app/inventory", "/app/expenses", "/app/signing", "/app/assistant", "/app/complaints", "/app/performance", "/app/manual"];
const MANAGER_EXTRA = ["/app/employees", "/app/safety"];
const EXEC_EXTRA = ["/app/hr", "/app/payroll"];

export function allowedNavFor(user, data) {
  if (!user) return new Set(BASE);
  const allowed = new Set(BASE);
  const role = user.role;
  const hrLevel = user.hrLevelId && Array.isArray(data?.hrLevels) ? data.hrLevels.find((level) => level.id === user.hrLevelId) : null;
  const hrPermissions = new Set(hrLevel?.permissions || []);
  if (["station_manager", "pgm", "ops_manager", "director"].includes(role)) {
    MANAGER_EXTRA.forEach((p) => allowed.add(p));
  }
  if (["employee", "safety_officer"].includes(role)) allowed.add("/app/safety");
  if (["ops_manager", "director"].includes(role)) {
    EXEC_EXTRA.forEach((p) => allowed.add(p));
  }
  if (role === "pgm") allowed.add("/app/payroll");
  // Employees holding an HR position need the HR section and the employee directory.
  if (user.hrLevelId) {
    allowed.add("/app/hr");
    if (hrPermissions.has("view_employees") || hrPermissions.has("manage_employees")) allowed.add("/app/employees");
    if (hrPermissions.has("view_safety")) allowed.add("/app/safety");
    if (hrPermissions.has("manage_payroll")) allowed.add("/app/payroll");
  }
  return allowed;
}