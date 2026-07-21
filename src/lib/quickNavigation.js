export const visitKey = (companyId, userId) => `powercare_visits_${companyId}_${userId}`;

export function recordPageVisit(companyId, userId, pathname) {
  if (!companyId || !userId || !pathname.startsWith("/app")) return;
  const key = visitKey(companyId, userId);
  let visits = {};
  try { visits = JSON.parse(localStorage.getItem(key) || "{}"); } catch { visits = {}; }
  visits[pathname] = (visits[pathname] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(visits));
}

export function mostVisited(items, companyId, userId, limit = 4) {
  let visits = {};
  try { visits = JSON.parse(localStorage.getItem(visitKey(companyId, userId)) || "{}"); } catch { visits = {}; }
  return [...items].sort((a, b) => (visits[b.to] || 0) - (visits[a.to] || 0)).filter((item) => visits[item.to]).slice(0, limit);
}

export function quickPathsFor(role) {
  if (role === "employee") return ["/app/attendance", "/app/tasks", "/app/daily-report", "/app/complaints"];
  if (["director", "ops_manager", "pgm"].includes(role)) return ["/app", "/app/employees", "/app/daily-report", "/app/tasks"];
  if (role === "station_manager") return ["/app/tasks", "/app/attendance", "/app/employees", "/app/daily-report"];
  if (role === "inventory_keeper") return ["/app/inventory", "/app/tasks", "/app/attendance", "/app/daily-report"];
  if (role === "financial_officer") return ["/app/expenses", "/app/tasks", "/app/attendance", "/app/daily-report"];
  return ["/app/attendance", "/app/tasks", "/app/daily-report", "/app/safety"];
}

export function mobilePathsFor(role) {
  if (role === "employee") return ["/app/attendance", "/app/tasks", "/app/complaints", "/app"];
  if (["director", "ops_manager", "pgm", "station_manager"].includes(role)) return ["/app", "/app/employees", "/app/daily-report", "/app/tasks"];
  if (role === "inventory_keeper") return ["/app/inventory", "/app/attendance", "/app/tasks", "/app"];
  if (role === "financial_officer") return ["/app/expenses", "/app/attendance", "/app/tasks", "/app"];
  return ["/app/attendance", "/app/safety", "/app/tasks", "/app"];
}