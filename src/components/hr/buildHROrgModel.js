const stationKey = (station) => station.id || station.stationId;
const managerKey = (employee) => employee.profile?.directManagerId || employee.directManagerId;

export default function buildHROrgModel(data, company, currentUser) {
  const stations = data.stations || [];
  const employees = data.employees || [];
  const levels = (data.hrLevels || []).filter((level) => level.active !== false && ["company", "cluster"].includes(level.scope));
  const levelById = new Map(levels.map((level) => [level.id, level]));
  const hrEmployees = employees.filter((employee) => levelById.has(employee.hrLevelId));
  const companyManagers = hrEmployees.filter((employee) => {
    const level = levelById.get(employee.hrLevelId);
    return level.scope === "company" && level.role === "manager";
  });
  const fallbackManagers = hrEmployees.filter((employee) => levelById.get(employee.hrLevelId)?.role === "manager");
  const managers = companyManagers.length ? companyManagers : fallbackManagers.length ? fallbackManagers : hrEmployees;
  const managerIds = new Set(managers.map((employee) => employee.id));
  const supporting = hrEmployees.filter((employee) => !managerIds.has(employee.id));
  const overlap = (left, right) => (left.managedStations || []).filter((id) => (right.managedStations || []).includes(id)).length;
  const managerFor = (employee) => managers.find((manager) => manager.id === managerKey(employee)) || [...managers].sort((a, b) => overlap(b, employee) - overlap(a, employee))[0];
  const employeesFor = (station) => employees.filter((employee) => employee.id !== data.ownerId && (employee.stationId === stationKey(station) || employee.hrStationId === stationKey(station)));
  const stationsFor = (employee) => stations.filter((station) => (employee.managedStations || []).includes(stationKey(station))).map((station) => ({ station, employees: employeesFor(station) }));
  const groups = managers.map((manager) => ({ manager, level: levelById.get(manager.hrLevelId), stations: stationsFor(manager), assistants: supporting.filter((employee) => managerFor(employee)?.id === manager.id).map((employee) => ({ employee, level: levelById.get(employee.hrLevelId), stations: stationsFor(employee) })) }));
  const assigned = new Set(hrEmployees.flatMap((employee) => employee.managedStations || []));
  const unassigned = stations.filter((station) => !assigned.has(stationKey(station))).map((station) => ({ station, employees: employeesFor(station) }));
  const owner = employees.find((employee) => employee.id === data.ownerId) || employees.find((employee) => employee.role === "owner" || employee.email === company?.ownerEmail) || currentUser;
  return { owner, groups, unassigned, levelById };
}