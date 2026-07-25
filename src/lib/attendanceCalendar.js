export function calendarDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function monthGridDays(year, month) {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1)),
  ];
}

export function taskStationId(task, data) {
  const fallback = data?.stations?.[0]?.id || null;
  if (task.assignment_type === "station_team") return task.assignment_id || task.station_id || fallback;
  if (task.assignment_type === "member") {
    return task.station_id || data?.employees?.find((employee) => employee.id === task.employee_id)?.stationId || fallback;
  }
  return task.station_id || fallback;
}

export function tasksDueOn(tasks, key) {
  return tasks.filter((task) => {
    const due = task.end_date || task.endDate || task.due_date;
    return due && String(due).slice(0, 10) === key;
  });
}

export function employeeScheduledOn(schedules, employeeId, key) {
  return schedules.some((schedule) => (schedule.shiftTypes || []).some((shift) =>
    (schedule.assignments?.[key]?.[shift.id] || []).includes(employeeId)
  ));
}