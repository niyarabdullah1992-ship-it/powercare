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