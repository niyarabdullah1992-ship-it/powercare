import React from "react";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import useAttendancePresence from "@/hooks/useAttendancePresence";

// Small colored dot reflecting an employee's current presence (online/away/busy/in a call)
// or "on leave" if they have an approved leave today. Used anywhere a name list is shown.
export default function PresenceDot({ employee, className = "" }) {
  const attendance = useAttendancePresence(employee?.id);
  if (isOnLeaveToday(employee)) return <span className={`w-2 h-2 rounded-full bg-sky-500 shrink-0 ${className}`} title="onLeaveStatus" />;
  const checkedIn = !!attendance?.check_in_at && !attendance?.check_out_at;
  const inZone = attendance?.in_zone === true || attendance?.inZone === true || attendance?.location_status === "inside";
  const manual = attendance?.manual_override === true || attendance?.manualOverride === true || attendance?.location_status === "manual";
  const tone = checkedIn && inZone ? "bg-emerald-500" : checkedIn ? "bg-amber-500" : "bg-slate-400";
  const title = checkedIn && manual ? "Manual attendance" : checkedIn && inZone ? "Inside station" : checkedIn ? "Outside station" : "Not checked in";
  return <span className={`w-2 h-2 rounded-full ${tone} shrink-0 ${className}`} title={title} />;
}