const LATE_ALERT_MARKER = "has not checked in";

function todayIndexInRiyadh() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "short",
  }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

export function shouldShowNotification(message, data) {
  if (!String(message || "").includes(LATE_ALERT_MARKER)) return true;
  const dayIndex = todayIndexInRiyadh();
  const scheduledIds = new Set();
  for (const schedule of data?.schedules || []) {
    for (const shift of schedule.shiftTypes || []) {
      for (const employeeId of schedule.assignments?.[dayIndex]?.[shift.id] || []) {
        scheduledIds.add(employeeId);
      }
    }
  }
  return (data?.employees || []).some(
    (employee) => scheduledIds.has(employee.id) && String(message).includes(employee.name)
  );
}