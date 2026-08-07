export function employeeSearchText(employee, stations, roleLabel) {
  const stationIds = [employee.stationId, ...(employee.stationIds || []), ...(employee.managedStations || [])].filter(Boolean);
  const stationText = stations.filter((station) => stationIds.includes(station.id)).map((station) => `${station.name || ""} ${station.location || ""}`).join(" ");
  return [
    employee.name,
    employee.email,
    employee.phone,
    employee.employeeId,
    employee.anonymousId,
    employee.position,
    employee.customTitle,
    employee.profile?.position,
    roleLabel(employee.role),
    stationText,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function matchesEmployeeSearch(employee, query, stations, roleLabel) {
  const normalized = query.trim().toLowerCase();
  return !normalized || employeeSearchText(employee, stations, roleLabel).includes(normalized);
}