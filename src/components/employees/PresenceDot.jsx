import React from "react";
import { PRESENCE_OPTIONS } from "@/components/employees/PresenceStatusPicker";
import { isOnLeaveToday } from "@/lib/leaveTypes";

// Small colored dot reflecting an employee's current presence (online/away/busy/in a call)
// or "on leave" if they have an approved leave today. Used anywhere a name list is shown.
export default function PresenceDot({ employee, className = "" }) {
  if (isOnLeaveToday(employee)) {
    return <span className={`w-2 h-2 rounded-full bg-sky-500 shrink-0 ${className}`} title="onLeaveStatus" />;
  }
  const presence = PRESENCE_OPTIONS.find((o) => o.key === employee.presenceStatus) || PRESENCE_OPTIONS[0];
  return <span className={`w-2 h-2 rounded-full ${presence.dot} shrink-0 ${className}`} />;
}