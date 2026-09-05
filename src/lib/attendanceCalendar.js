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
  return (schedules || []).some((schedule) => (schedule.shiftTypes || []).some((shift) =>
    (schedule.assignments?.[key]?.[shift.id] || []).includes(employeeId)
  ));
}

export function hasPublishedScheduleOn(schedules, key) {
  return (schedules || []).some((schedule) =>
    (schedule.shiftTypes || []).some((shift) =>
      (schedule.assignments?.[key]?.[shift.id] || []).length > 0
    )
  );
}

export function attendanceRowDateKey(row) {
  return String(row?.date || row?.dateKey || "").slice(0, 10);
}

/**
 * Day status for the attendance month calendar.
 * Future scheduled days stay empty (not marked absent).
 */
export function dayAttendanceStatus({ employee, row, dateKey, schedules, todayKey, onLeave }) {
  if (row?.check_in_at || row?.checkInAt) {
    return row.status === "late" ? "late" : "present";
  }
  if (onLeave) return "on_leave";
  const published = hasPublishedScheduleOn(schedules, dateKey);
  const scheduled = employeeScheduledOn(schedules, employee?.id, dateKey);
  if (published && !scheduled) return "off_day";
  if (dateKey > todayKey) return null;
  return "absent";
}

export function summarizeAttendanceDay({ employees = [], rows = [], dateKey, schedules, todayKey, leaveOn }) {
  const byEmployee = Object.fromEntries(
    (rows || []).map((row) => [String(row.employee_id ?? row.employeeId), row]),
  );
  const counts = { present: 0, late: 0, absent: 0, on_leave: 0, off_day: 0 };
  for (const employee of employees) {
    const status = dayAttendanceStatus({
      employee,
      row: byEmployee[String(employee.id)],
      dateKey,
      schedules,
      todayKey,
      onLeave: typeof leaveOn === "function" ? leaveOn(employee, dateKey) : false,
    });
    if (status && counts[status] != null) counts[status] += 1;
  }
  return counts;
}