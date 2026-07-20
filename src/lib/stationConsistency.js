export function reconcileStationReferences(data) {
  if (!data) return data;
  const seen = new Set();
  data.stations = (data.stations || []).filter((station) => {
    if (!station?.id || seen.has(station.id)) return false;
    seen.add(station.id);
    return true;
  });
  const valid = new Set(data.stations.map((station) => station.id));
  if (valid.size === 0) return data;
  const belongsToExistingStation = (record) => {
    const stationId = record?.stationId || record?.station_id;
    return !stationId || valid.has(stationId);
  };

  (data.employees || []).forEach((employee) => {
    if (employee.stationId && !valid.has(employee.stationId)) employee.stationId = null;
    if (employee.hrStationId && !valid.has(employee.hrStationId)) employee.hrStationId = null;
    employee.managedStations = (employee.managedStations || []).filter((id) => valid.has(id));
  });

  ["tasks", "reports", "anonymousReports", "publicReports", "safety", "files", "plans", "templates", "personalAttendance", "targets", "schedules"].forEach((key) => {
    data[key] = (data[key] || []).filter((record) => {
      if (!belongsToExistingStation(record)) return false;
      const stationAssignment = record.assignmentType === "station_team" || record.assignment_type === "station_team";
      const assignmentId = record.assignmentId || record.assignment_id;
      return !stationAssignment || !assignmentId || valid.has(assignmentId);
    });
  });

  ["hrClusters", "stationChatGroups"].forEach((key) => {
    (data[key] || []).forEach((record) => { record.stationIds = (record.stationIds || []).filter((id) => valid.has(id)); });
  });
  (data.payrollRuns || []).forEach((run) => (run.items || []).forEach((item) => {
    if (item.employeeStationId && !valid.has(item.employeeStationId)) item.employeeStationId = null;
  }));
  return data;
}