import { visibleStations, canSeeAllStations } from "@/lib/permissions";

// Builds a compact JSON snapshot of the company data the current user is allowed
// to see — sent as context to the AI assistant so it can answer questions about
// stations, employees, tasks, reports and safety.
export function buildAssistantContext(data, currentUser) {
  const stations = visibleStations(currentUser, data);
  const stationIds = new Set(stations.map((s) => s.id));
  const stationName = (id) => stations.find((s) => s.id === id)?.name || (id ? "other" : "HQ");

  const employees = data.employees
    .filter((e) => !e.stationId ? canSeeAllStations(currentUser) : stationIds.has(e.stationId))
    .map((e) => ({ name: e.name, role: e.role, position: e.position || undefined, station: stationName(e.stationId), points: e.points || 0 }));

  const empName = (id) => data.employees.find((e) => e.id === id)?.name || "—";

  const tasks = data.tasks
    .filter((tk) => !tk.stationId || stationIds.has(tk.stationId))
    .slice(-60)
    .map((tk) => ({ title: tk.title, status: tk.status, progress: tk.progress, target: tk.dailyTarget, station: stationName(tk.stationId), assignee: empName(tk.assignedTo), createdAt: tk.createdAt }));

  const reports = data.reports
    .filter((r) => !r.stationId || stationIds.has(r.stationId))
    .slice(-30)
    .map((r) => ({ title: r.title, content: r.content, status: r.status, station: stationName(r.stationId), author: empName(r.authorId), date: r.createdAt }));

  const safety = (data.safety || [])
    .filter((s) => stationIds.has(s.stationId))
    .map((s) => ({ station: stationName(s.stationId), level: s.level, incidents: s.incidents, hazards: s.hazards }));

  return {
    company: data.name,
    today: new Date().toISOString().slice(0, 10),
    stations: stations.map((s) => ({ name: s.name, location: s.location, type: s.type, status: s.status, manager: empName(s.managerId) })),
    employees,
    tasks,
    dailyReports: reports,
    safety,
  };
}