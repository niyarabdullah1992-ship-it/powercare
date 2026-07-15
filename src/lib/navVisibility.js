// Single source of truth for which sections each role can see —
// used by the sidebar/mobile nav and the dashboards' quick-access shortcuts.

const BASE = ["/app", "/app/daily-report", "/app/tasks", "/app/attendance", "/app/chat", "/app/files", "/app/signing", "/app/assistant", "/app/complaints", "/app/performance", "/app/help"];
const MANAGER_EXTRA = ["/app/employees", "/app/stations", "/app/reports"];
const EXEC_EXTRA = ["/app/hr", "/app/executive"];
// Individual (personal) workspaces: only the personal-productivity sections.
const INDIVIDUAL = ["/app", "/app/tasks", "/app/planner", "/app/calendar", "/app/attendance", "/app/journal", "/app/files", "/app/signing", "/app/assistant", "/app/help"];

export function allowedNavFor(user, plan) {
  if (String(plan || "").toLowerCase() === "individual") return new Set(INDIVIDUAL);
  if (!user) return new Set(BASE);
  const allowed = new Set(BASE);
  const role = user.role;
  if (["station_manager", "pgm", "ops_manager", "director"].includes(role)) {
    MANAGER_EXTRA.forEach((p) => allowed.add(p));
  }
  if (["ops_manager", "director"].includes(role)) {
    EXEC_EXTRA.forEach((p) => allowed.add(p));
  }
  // Employees holding an HR position need the HR section and the employee directory.
  if (user.hrLevelId) {
    allowed.add("/app/hr");
    allowed.add("/app/employees");
  }
  return allowed;
}