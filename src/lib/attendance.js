import { base44 } from "@/api/base44Client";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import { toRiyadhDateKey } from "@/lib/riyadhDate";

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

export function isActiveAttendance(att) {
  if (!att?.check_in_at || att.check_out_at) return false;
  const inZone = att.in_zone === true || att.inZone === true || att.location_status === "inside";
  const manualOverride = att.manual_override === true || att.manualOverride === true || att.location_status === "manual";
  return inZone || manualOverride;
}

export function isCheckedIn(att) {
  return isActiveAttendance(att);
}

export function isScheduledToday(employee, data) {
  if (!employee?.id) return false;
  const dateKey = toRiyadhDateKey();
  return (data?.schedules || []).some((schedule) =>
    (schedule.shiftTypes || []).some((shift) =>
      (schedule.assignments?.[dateKey]?.[shift.id] || []).includes(employee.id)
    )
  );
}

export function getAttendanceStatus(employee, attRow, data) {
  if (isActiveAttendance(attRow)) return attRow.status === "late" ? "late" : "present";
  if (isOnLeaveToday(employee)) return "on_leave";
  if (!isScheduledToday(employee, data)) return "not_scheduled";
  return "absent";
}

// Looks up the employee's shift for today from the station's existing weekly schedule
// (Schedules page) — reused here instead of a separate attendance-only schedule.
export function getTodaysShift(data, employee) {
  if (!employee?.id) return null;
  const stationIds = [employee.stationId || data?.stations?.[0]?.id, ...(employee.managedStations || [])].filter(Boolean);
  const dateKey = toRiyadhDateKey();
  for (const stationId of stationIds) {
    const schedule = (data?.schedules || []).find((s) => s.stationId === stationId);
    for (const st of schedule?.shiftTypes || []) {
      const ids = schedule.assignments?.[dateKey]?.[st.id] || [];
      if (ids.includes(employee.id)) return { start: st.start, end: st.end, label: st.label, stationId };
    }
  }
  return null;
}