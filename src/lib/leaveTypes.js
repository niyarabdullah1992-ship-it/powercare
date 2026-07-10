// Shared leave category config used across leave components.

export const LEAVE_TYPES = [
  { key: "annual", defaultTotal: 21 },
  { key: "sick", defaultTotal: null, requiresFile: true },
  { key: "exam", defaultTotal: null, requiresFile: true },
  { key: "marriage", defaultTotal: 3 },
  { key: "bereavement", defaultTotal: 5 },
  { key: "maternity", defaultTotal: 70 },
  { key: "paternity", defaultTotal: 3 },
  { key: "unpaid", defaultTotal: null },
];

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