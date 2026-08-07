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
  (data.employees || []).forEach((employee) => {
    if (employee.stationId && !valid.has(employee.stationId)) employee.stationId = null;
    if (employee.hrStationId && !valid.has(employee.hrStationId)) employee.hrStationId = null;
    employee.managedStations = (employee.managedStations || []).filter((id) => valid.has(id));
  });

  data.schedules = (data.schedules || []).filter((schedule) => !schedule.stationId || valid.has(schedule.stationId));
  ["hrClusters", "stationChatGroups"].forEach((key) => {
    (data[key] || []).forEach((record) => { record.stationIds = (record.stationIds || []).filter((id) => valid.has(id)); });
  });
  (data.payrollRuns || []).forEach((run) => (run.items || []).forEach((item) => {
    if (item.employeeStationId && !valid.has(item.employeeStationId)) item.employeeStationId = null;
  }));
  return data;
}