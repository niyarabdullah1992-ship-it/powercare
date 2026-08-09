import moment from "moment";

export const DEFAULT_REPORT_DUE_TIME = "08:00";

// Three distinct states — a unit with no shifts and no due tasks owes no report,
// so it must never be counted as late.
// reported | late | waiting | idle
export function buildUnitStatuses({ stations, day, timeline, targets, schedules, stationOf, dueTime = DEFAULT_REPORT_DUE_TIME, now = new Date() }) {
  const isDay = (value) => value && moment(value).isSame(moment(day), "day");
  const [dueHour, dueMinute] = String(dueTime || DEFAULT_REPORT_DUE_TIME).split(":").map((part) => Number(part) || 0);
  const dueMoment = moment(day).hour(dueHour).minute(dueMinute).second(0);
  const beforeDue = moment(now).isBefore(dueMoment);

  const hasShift = (stationId) => {
    const schedule = (schedules || []).find((item) => item.stationId === stationId);
    const dayAssignments = schedule?.assignments?.[day];
    return Boolean(dayAssignments && Object.values(dayAssignments).some((ids) => (ids || []).length > 0));
  };

  const hasDueTask = (stationId) =>
    (targets || []).some((task) => stationOf(task) === stationId && (isDay(task.end_date) || isDay(task.created_at)));

  return (stations || []).map((station) => {
    const first = timeline
      .filter((entry) => entry.stationKey === station.id)
      .sort((a, b) => new Date(a.at) - new Date(b.at))[0];

    if (first) return { id: station.id, name: station.name, status: "reported", firstAt: first.at };

    const owesReport = hasShift(station.id) || hasDueTask(station.id);
    if (!owesReport) return { id: station.id, name: station.name, status: "idle", firstAt: null };
    if (beforeDue) return { id: station.id, name: station.name, status: "waiting", firstAt: null, dueAt: dueMoment.toISOString() };
    return { id: station.id, name: station.name, status: "late", firstAt: null, lateSince: dueMoment.toISOString() };
  });
}