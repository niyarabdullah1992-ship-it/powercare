// Shared leave category config used across leave components.

export const LEAVE_TYPES = [
  { key: "annual", defaultTotal: 21 },
  { key: "sick", defaultTotal: null, requiresFile: true },
  { key: "exam", defaultTotal: null, requiresFile: true },
  { key: "marriage", defaultTotal: 3 },
  { key: "bereavement", defaultTotal: 5 },
  { key: "maternity", defaultTotal: 70 },
  { key: "paternity", defaultTotal: 3 },
  { key: "newborn", defaultTotal: 3 },
  { key: "hajj", defaultTotal: 10 },
  { key: "emergency", defaultTotal: 5 },
  { key: "patientCompanion", defaultTotal: null, requiresFile: true },
  { key: "iddah", defaultTotal: 130 },
  { key: "otherLeave", defaultTotal: null },
  { key: "otherRequest", defaultTotal: null },
  { key: "unpaid", defaultTotal: null },
];

// Maternity is hidden for male employees, paternity for female employees.
// If gender isn't recorded yet, both stay visible.
export function isLeaveTypeAllowed(profile, key) {
  const gender = profile?.gender;
  if (key === "maternity") return gender !== "male";
  if (key === "paternity" || key === "newborn") return gender !== "female";
  if (key === "iddah") return gender !== "male";
  return true;
}

export function visibleLeaveTypes(profile) {
  return LEAVE_TYPES.filter((ty) => isLeaveTypeAllowed(profile, ty.key));
}

// Requests longer than this many days require a mandatory justification + supporting file.
export const LEAVE_THRESHOLD_DAYS = 5;

export function getLeaveTotal(profile, key) {
  const custom = profile?.leaveTotals?.[key];
  if (custom != null) return custom;
  return LEAVE_TYPES.find((ty) => ty.key === key)?.defaultTotal ?? null;
}

export function usedLeaveDays(requests, key) {
  return (requests || [])
    .filter((r) => r.type === key && r.status === "approved")
    .reduce((sum, r) => sum + (r.days || 0), 0);
}

export function computeDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  return Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
}

// True when an approved request covers the supplied day. Annual leave uses its
// approval-activated window when available; every comparison is date-only and inclusive.
export function isOnApprovedLeave(employee, date = new Date()) {
  const day = typeof date === "string"
    ? date.slice(0, 10)
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(date);
  return (employee?.leaveRequests || []).some((request) => {
    if (request.status !== "approved") return false;
    const useActiveWindow = request.type === "annual" && request.activeStartDate && request.activeEndDate;
    const start = (useActiveWindow ? request.activeStartDate : request.startDate)?.slice(0, 10);
    const end = (useActiveWindow ? request.activeEndDate : request.endDate)?.slice(0, 10);
    return !!start && !!end && start <= day && day <= end;
  });
}

export function isOnLeaveToday(employee) {
  return isOnApprovedLeave(employee, new Date());
}