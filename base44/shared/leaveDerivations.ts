/** Leave derivation — statutory types, days, approve gate (>5 days needs attachment).
 *  Design ref: NiroVera Platform.dc.html class Component (leave / canOk / needsDoc).
 */

export const LEAVE_THRESHOLD_DAYS = 5;

export const LEAVE_TYPES = [
  { key: "annual", total: 21, article: "109", ar: "سنوية", en: "Annual" },
  { key: "sick", total: 30, article: "117", ar: "مرضية", en: "Sick", requiresFile: true },
  { key: "maternity", total: 70, article: "151", ar: "وضع", en: "Maternity", f: true },
  { key: "paternity", total: 3, article: "113", ar: "مولود", en: "Paternity", m: true },
  { key: "marriage", total: 3, article: "113", ar: "زواج", en: "Marriage" },
  { key: "bereavement", total: 5, article: "113", ar: "وفاة", en: "Bereavement" },
  { key: "hajj", total: 10, article: "114", ar: "حج", en: "Hajj" },
  { key: "exam", total: null, article: "115", ar: "امتحان", en: "Exam", requiresFile: true },
  { key: "holiday", total: 8, article: null, ar: "أعياد", en: "Eid / public holidays" },
  { key: "emergency", total: 5, article: null, ar: "اضطرارية", en: "Emergency" },
  { key: "unpaid", total: null, article: null, ar: "بدون راتب", en: "Unpaid" },
  { key: "other", total: null, article: null, ar: "أخرى", en: "Other" },
] as const;

export type LeaveRequestLike = {
  id?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  files?: unknown[] | null;
  reason?: string | null;
  status?: string;
  employeeId?: string;
};

/** Inclusive calendar days between YYYY-MM-DD dates (local parts, not UTC ISO). */
export function computeLeaveDays(startDate: string | null | undefined, endDate: string | null | undefined) {
  if (!startDate || !endDate) return 0;
  const a = new Date(`${String(startDate).slice(0, 10)}T00:00:00`);
  const b = new Date(`${String(endDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function leaveNeedsAttachment(request: LeaveRequestLike) {
  const days = Number(request.days) || computeLeaveDays(request.startDate, request.endDate);
  const type = LEAVE_TYPES.find((t) => t.key === request.type);
  if (type && "requiresFile" in type && type.requiresFile) return true;
  return days > LEAVE_THRESHOLD_DAYS;
}

export function hasLeaveAttachment(request: LeaveRequestLike) {
  return Array.isArray(request.files) && request.files.length > 0;
}

/** Named approve gate — never silent. */
export function checkApproveLeaveGate(request: LeaveRequestLike | null | undefined) {
  if (!request) {
    return {
      ok: false as const,
      error: "LEAVE_NOT_FOUND",
      reason: "طلب الإجازة غير موجود في نطاق الشركة.",
      reasonEn: "Leave request was not found in this company.",
    };
  }
  if (request.status && request.status !== "pending") {
    return {
      ok: false as const,
      error: "LEAVE_NOT_PENDING",
      reason: "لا يمكن اعتماد طلب غير معلّق.",
      reasonEn: "Only pending leave requests can be approved.",
    };
  }
  const days = Number(request.days) || computeLeaveDays(request.startDate, request.endDate);
  if (leaveNeedsAttachment(request) && !hasLeaveAttachment(request)) {
    return {
      ok: false as const,
      error: "ATTACHMENT_REQUIRED",
      reason: "لا يمكن الاعتماد — يلزم مستند لطلب يتجاوز 5 أيام (أو لنوع يتطلب مرفقًا).",
      reasonEn: "Approval blocked — a document is required for a request over 5 days (or a type that requires an attachment).",
      days,
      threshold: LEAVE_THRESHOLD_DAYS,
    };
  }
  return { ok: true as const, days };
}

/** Derived queue stats — never stored literals. */
export function deriveLeaveStats(requests: LeaveRequestLike[]) {
  const list = Array.isArray(requests) ? requests : [];
  const pending = list.filter((r) => (r.status || "pending") === "pending");
  const approved = list.filter((r) => r.status === "approved");
  const rejected = list.filter((r) => r.status === "rejected");
  const needsDoc = pending.filter((r) => leaveNeedsAttachment(r) && !hasLeaveAttachment(r));
  return {
    total: list.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    needsDoc: needsDoc.length,
  };
}

/** True when an approved request covers the day (annual uses active window when set). */
export function isOnApprovedLeave(requests: LeaveRequestLike[] | null | undefined, dayKey: string) {
  const day = String(dayKey || "").slice(0, 10);
  if (!day) return false;
  return (requests || []).some((request) => {
    if (request.status !== "approved") return false;
    const useActive =
      request.type === "annual" &&
      (request as { activeStartDate?: string }).activeStartDate &&
      (request as { activeEndDate?: string }).activeEndDate;
    const start = String(
      useActive
        ? (request as { activeStartDate?: string }).activeStartDate
        : request.startDate || "",
    ).slice(0, 10);
    const end = String(
      useActive
        ? (request as { activeEndDate?: string }).activeEndDate
        : request.endDate || "",
    ).slice(0, 10);
    return !!start && !!end && start <= day && day <= end;
  });
}
