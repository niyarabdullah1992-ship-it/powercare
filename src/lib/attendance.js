import { base44 } from "@/api/base44Client";

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

// Looks up the employee's shift for today from the station's existing weekly schedule
// (Schedules page) — reused here instead of a separate attendance-only schedule.
export function getTodaysShift(data, employee) {
  if (!employee?.stationId) return null;
  const schedule = (data?.schedules || []).find((s) => s.stationId === employee.stationId);
  if (!schedule) return null;
  const dayIndex = new Date().getDay();
  for (const st of schedule.shiftTypes || []) {
    const ids = schedule.assignments?.[dayIndex]?.[st.id] || [];
    if (ids.includes(employee.id)) return { start: st.start, end: st.end, label: st.label };
  }
  return null;
}