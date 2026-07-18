import { base44 } from "@/api/base44Client";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import { HQ_STATION_ID } from "@/lib/store";

// Thin helpers around the supabaseAttendance backend function, shared by the
// check-in widget, manager dashboards, and the task-gating check in MyTasks.
export async function getTodayAttendance(employeeId) {
  try {
    const res = await base44.functions.invoke("supabaseAttendance", { action: "getTodayStatus", employeeId });
    return res?.data?.attendance || null;
  } catch {
    return null;
  }
}

export function isCheckedIn(att) {
  return !!(att && att.check_in_at && att.status !== "absent");
}

export function isScheduledToday(employee, data) {
  if (!employee?.id) return false;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", weekday: "short" }).format(new Date());
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return (data?.schedules || []).some((schedule) =>
    (schedule.shiftTypes || []).some((shift) =>
      (schedule.assignments?.[dayIndex]?.[shift.id] || []).includes(employee.id)
    )
  );
}

export function getAttendanceStatus(employee, attRow, data) {
  if (isOnLeaveToday(employee)) return "on_leave";
  if (!isScheduledToday(employee, data)) return "not_scheduled";
  if (!attRow) return "absent";
  if (attRow.status === "present" || attRow.status === "late" || attRow.status === "not_yet") return attRow.status;
  return attRow.check_in_at ? "present" : "absent";
}

// Looks up the employee's shift for today from the station's existing weekly schedule
// (Schedules page) — reused here instead of a separate attendance-only schedule.
export function getTodaysShift(data, employee) {
  if (!employee?.id) return null;
  const stationIds = [employee.stationId || HQ_STATION_ID, ...(employee.managedStations || [])].filter(Boolean);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", weekday: "short" }).format(new Date());
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  for (const stationId of stationIds) {
    const schedule = (data?.schedules || []).find((s) => s.stationId === stationId);
    for (const st of schedule?.shiftTypes || []) {
      const ids = schedule.assignments?.[dayIndex]?.[st.id] || [];
      if (ids.includes(employee.id)) return { start: st.start, end: st.end, label: st.label, stationId };
    }
  }
  return null;
}