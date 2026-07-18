// Role-based permission helpers for PowerCare.
// Roles: director | ops_manager | pgm | station_manager | employee
const employeeStationId = (employee, data) => employee?.stationId || data?.stations?.[0]?.id || null;
const stationsInOrder = (stations) => [...(stations || [])];

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
  const stations = stationsInOrder(data.stations);
  if (canSeeAllStations(user) || user?.id === data?.ownerId) return stations;
  if (user.role === "pgm") {
    const managed = user.managedStations || [];
    return stations.filter((s) => managed.includes(s.id));
  }
  if (user.role === "station_manager") {
    const managed = user.managedStations?.length ? user.managedStations : [employeeStationId(user, data)].filter(Boolean);
    return stations.filter((station) => managed.includes(station.id));
  }
  if (user.role === "employee") return stations.filter((station) => station.id === employeeStationId(user, data));
  return [];
}

// Can the user manage stations (add/edit)?
export function canManageStations(user, data) {
  return user?.role === "director" || user?.id === data?.ownerId;
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

// Is this user the actual company owner (not just holding the director role)?
export function isCompanyOwner(user, data) {
  return user?.id === data?.ownerId;
}

// Can the user create/edit HR levels and their permissions? Directors always can;
// the company owner can too, even if their role isn't "director".
export function canManageHRLevels(user, data) {
  return user.role === "director" || user.id === data?.ownerId;
}

// Is this user holding the topmost active HR tier (the highest-ranking HR position)?
export function isTopHRHolder(user, data) {
  const levels = (data?.hrLevels || []).filter((l) => l.active !== false);
  if (levels.length === 0) return false;
  if (!user?.hrLevelId) return false;
  const topOrder = Math.max(...levels.map((l) => l.order || 0));
  return levels.some((l) => l.order === topOrder && l.id === user.hrLevelId);
}

// Only the company owner or whoever holds the topmost HR position may assign a
// single position to more than one station — everyone else picks one station at a time.
export function canAssignMultiStation(user, data) {
  return user?.id === data?.ownerId || isTopHRHolder(user, data);
}

// Is this employee part of the HR hierarchy?
export function isHR(employee) {
  return !!employee.hrLevelId;
}

// Does this employee's HR level grant a specific permission?
export function hasHRPermission(user, data, permKey) {
  if (!user?.hrLevelId) return false;
  const level = (data?.hrLevels || []).find((l) => l.id === user.hrLevelId && l.active !== false);
  return !!level?.permissions?.includes(permKey);
}

// Payroll adjustments are restricted to HR staff with payroll permission and
// company roles ranked above Station Manager (PGM, Operations, Director, Owner).
export function canAdjustPayroll(user, data) {
  if (!user) return false;
  return user.id === data?.ownerId
    || (ROLE_RANK[user.role] || 0) > ROLE_RANK.station_manager
    || hasHRPermission(user, data, "manage_payroll");
}

// Stations an HR member can act on: [] none, [stationId, ...] scoped, or null for company-wide reach.
export function hrScopeStations(user, data) {
  if (!user?.hrLevelId) return [];
  const level = (data?.hrLevels || []).find((l) => l.id === user.hrLevelId);
  if (!level) return [];
  if (level.stationIds && level.stationIds.length > 0) return level.stationIds; // explicit station restriction, any scope
  if (level.scope === "station") return user.hrStationId ? [user.hrStationId] : [];
  if (level.scope === "cluster") {
    const cluster = (data?.hrClusters || []).find((c) => c.id === user.hrClusterId);
    return cluster ? cluster.stationIds || [] : [];
  }
  return null; // company-wide (tiers 3-5)
}

// The HR level object (tier/role/scope/permissions) assigned to this user, if any.
export function getHRLevel(user, data) {
  if (!user?.hrLevelId) return null;
  return (data?.hrLevels || []).find((l) => l.id === user.hrLevelId && l.active !== false) || null;
}

export function isHRManager(user, data) {
  return getHRLevel(user, data)?.role === "manager";
}

export function isHRAssistant(user, data) {
  return getHRLevel(user, data)?.role === "assistant";
}

// Can the user manage a specific station's work schedule? Director always can;
// a station manager can for their own station; HR members need the explicit
// "manage_schedules" permission and to be in scope for that station.
export function canManageSchedule(user, data, stationId) {
  if (user.role === "director") return true;
  if (user.role === "station_manager" && employeeStationId(user, data) === stationId) return true;
  if (hasHRPermission(user, data, "manage_schedules")) {
    const scope = hrScopeStations(user, data);
    return scope === null || scope.includes(stationId);
  }
  return false;
}

// Privacy rule for full employee profiles (personal data, certificates, salary, leave):
// everyone sees their own profile; managers see profiles inside their station scope;
// HR members see profiles inside their HR scope. Regular employees can't open
// each other's profiles.
export function canViewEmployeeProfile(viewer, employee, data) {
  if (!viewer || !employee) return false;
  if (viewer.id === employee.id) return true;
  if (["director", "ops_manager"].includes(viewer.role) || viewer.id === data?.ownerId) return true;
  if (viewer.role === "pgm") {
    return (viewer.managedStations || []).includes(employeeStationId(employee, data));
  }
  if (viewer.role === "station_manager") {
    const managed = viewer.managedStations?.length ? viewer.managedStations : [employeeStationId(viewer, data)].filter(Boolean);
    return managed.includes(employeeStationId(employee, data));
  }
  if (viewer.hrLevelId) {
    const scope = hrScopeStations(viewer, data);
    return scope === null || scope.includes(employeeStationId(employee, data));
  }
  return false;
}

// Employees visible to a user (for management views)
export function visibleEmployees(user, data) {
  if (canSeeAllStations(user) || user?.id === data?.ownerId) return data.employees;
  if (user?.role === "station_manager") {
    const stationIds = new Set([employeeStationId(user, data), ...(user.managedStations || [])].filter(Boolean));
    return data.employees.filter((employee) => stationIds.has(employeeStationId(employee, data)));
  }
  if (hasHRPermission(user, data, "view_employees") || hasHRPermission(user, data, "manage_employees")) {
    const scope = hrScopeStations(user, data);
    return scope === null ? data.employees : data.employees.filter((employee) => scope.includes(employeeStationId(employee, data)));
  }
  const stationIds = new Set(visibleStations(user, data).map((station) => station.id));
  return data.employees.filter((employee) => stationIds.has(employeeStationId(employee, data)));
}