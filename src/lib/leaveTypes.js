// Shared leave category config used across leave components.

export const LEAVE_TYPES = [
  { key: "annual", defaultTotal: 21, ar: "سنوية", en: "Annual" },
  { key: "sick", defaultTotal: 30, requiresFile: true, ar: "مرضية", en: "Sick" },
  { key: "exam", defaultTotal: null, requiresFile: true, ar: "امتحان", en: "Exam" },
  { key: "marriage", defaultTotal: 3, ar: "زواج", en: "Marriage" },
  { key: "bereavement", defaultTotal: 5, ar: "وفاة", en: "Bereavement" },
  { key: "maternity", defaultTotal: 70, gender: "female", ar: "أمومة", en: "Maternity" },
  { key: "paternity", defaultTotal: 3, gender: "male", ar: "أبوة", en: "Paternity" },
  { key: "hajj", defaultTotal: 10, ar: "حج", en: "Hajj" },
  { key: "holiday", defaultTotal: 8, ar: "أعياد", en: "Eid / public holidays" },
  { key: "emergency", defaultTotal: 5, ar: "اضطرارية", en: "Emergency" },
  { key: "unpaid", defaultTotal: null, ar: "بدون راتب", en: "Unpaid" },
  { key: "other", defaultTotal: null, ar: "أخرى", en: "Other" },
];

export function leaveTypeLabel(type, ar = true) {
  const key = String(type || "").trim();
  const found = LEAVE_TYPES.find((item) => item.key === key.toLowerCase());
  if (found) return ar ? found.ar : found.en;
  if (!key) return ar ? "إجازة" : "Leave";
  if (/[\u0600-\u06FF]/.test(key)) return key;
  return key;
}

// Requests longer than this many days require a mandatory justification + supporting file.
export const LEAVE_THRESHOLD_DAYS = 5;

export function leaveTypesForProfile(profile) {
  const g = String(profile?.gender || "").toLowerCase();
  const female = g === "female" || g.includes("أنثى");
  const male = g === "male" || g.includes("ذكر");
  return LEAVE_TYPES.filter((ty) => {
    if (ty.gender === "female" && male) return false;
    if (ty.gender === "male" && female) return false;
    return true;
  });
}

export function isLeaveTypeAllowed(profile, key) {
  return leaveTypesForProfile(profile).some((ty) => ty.key === key);
}

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