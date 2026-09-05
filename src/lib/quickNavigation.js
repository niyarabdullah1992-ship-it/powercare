export function quickPathsFor(role) {
  if (role === "employee") return ["/app/attendance", "/app/tasks", "/app/work-proof", "/app/daily-report"];
  if (["director", "ops_manager", "pgm"].includes(role)) return ["/app", "/app/hr", "/app/daily-report", "/app/tasks"];
  if (role === "station_manager") return ["/app/tasks", "/app/attendance", "/app", "/app/daily-report"];
  if (role === "inventory_keeper") return ["/app/inventory", "/app/tasks", "/app/attendance", "/app/daily-report"];
  if (role === "financial_officer") return ["/app/expenses", "/app/tasks", "/app/attendance", "/app/daily-report"];
  return ["/app/attendance", "/app/tasks", "/app/daily-report", "/app/safety"];
}

export function mobilePathsFor(role) {
  if (role === "employee") return ["/app/attendance", "/app/tasks", "/app/work-proof", "/app"];
  if (["director", "ops_manager", "pgm"].includes(role)) return ["/app", "/app/hr", "/app/daily-report", "/app/tasks"];
  if (role === "station_manager") return ["/app", "/app/attendance", "/app/daily-report", "/app/tasks"];
  if (role === "inventory_keeper") return ["/app/inventory", "/app/attendance", "/app/tasks", "/app"];
  if (role === "financial_officer") return ["/app/expenses", "/app/attendance", "/app/tasks", "/app"];
  return ["/app/attendance", "/app/safety", "/app/tasks", "/app"];
}