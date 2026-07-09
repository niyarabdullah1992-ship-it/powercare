// Role-based permission helpers for PowerCare.
// Roles: director | ops_manager | pgm | station_manager | employee

export const ROLE_RANK = {
  director: 5,
  ops_manager: 4,
  pgm: 3,
  station_manager: 2,
  employee: 1,
};

// Can the user see all stations in the company?
export function canSeeAllStations(user) {
  return ["director", "ops_manager"].includes(user.role);
}

// Stations visible to a user given the company data
export function visibleStations(user, data) {
  if (canSeeAllStations(user)) return data.stations;
  if (user.role === "pgm") {
    const managed = user.managedStations || [];
    return data.stations.filter((s) => managed.includes(s.id));
  }
  if (user.role === "station_manager" || user.role === "employee") {
    return data.stations.filter((s) => s.id === user.stationId);
  }
  return [];
}

// Can the user manage stations (add/edit)?
export function canManageStations(user) {
  return ["director", "ops_manager"].includes(user.role);
}

// Can the user manage employees (add/remove)?
export function canManageEmployees(user) {
  if (user.role === "director") return true;
  if (user.role === "ops_manager") return true;
  if (user.role === "pgm") return !!user.canManageTeam;
  if (user.role === "station_manager") return true;
  return false;
}

// Can the user approve/reject reports?
export function canApproveReports(user) {
  return ["director", "ops_manager", "station_manager"].includes(user.role);
}

// Can the user reply to anonymous reports?
export function canReplyAnon(user) {
  return ["director", "ops_manager", "pgm", "station_manager"].includes(user.role);
}

// Can the user create tasks / templates / plans?
export function canCreateTasks(user) {
  return ["director", "ops_manager", "pgm", "station_manager"].includes(user.role);
}

// Can the user transfer director role / ownership?
export function canTransferOwnership(user) {
  return user.role === "director";
}

// Can the user create/edit HR levels and their permissions?
export function canManageHRLevels(user) {
  return user.role === "director";
}

// Is this employee part of the HR hierarchy?
export function isHR(employee) {
  return !!employee.hrLevelId;
}

// Does this employee's HR level grant a specific permission?
export function hasHRPermission(user, data, permKey) {
  if (!user?.hrLevelId) return false;
  const level = (data?.hrLevels || []).find((l) => l.id === user.hrLevelId);
  return !!level?.permissions?.includes(permKey);
}

// Stations an HR member can act on: [stationId] if tied to one station, or null for company-wide reach.
export function hrScopeStations(user) {
  if (!user?.hrLevelId) return [];
  return user.hrStationId ? [user.hrStationId] : null;
}

// Employees visible to a user (for management views)
export function visibleEmployees(user, data) {
  const stations = visibleStations(user, data);
  const stationIds = new Set(stations.map((s) => s.id));
  if (canSeeAllStations(user)) return data.employees;
  return data.employees.filter((e) => !e.stationId || stationIds.has(e.stationId));
}