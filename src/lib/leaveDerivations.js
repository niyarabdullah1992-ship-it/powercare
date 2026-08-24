/** Client helpers aligned with base44/shared/leaveDerivations.ts */

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
  { key: "emergency", total: 5, article: null, ar: "اضطرارية", en: "Emergency" },
  { key: "unpaid", total: null, article: null, ar: "بدون راتب", en: "Unpaid" },
];

export function computeLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const a = new Date(`${String(startDate).slice(0, 10)}T00:00:00`);
  const b = new Date(`${String(endDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function leaveNeedsAttachment(request, typeRequiresFile = false) {
  const days = Number(request?.days) || computeLeaveDays(request?.startDate, request?.endDate);
  const type = LEAVE_TYPES.find((t) => t.key === request?.type);
  if (typeRequiresFile || type?.requiresFile) return true;
  return days > LEAVE_THRESHOLD_DAYS;
}

export function checkApproveLeaveGate(request, typeRequiresFile = false) {
  if (!request) {
    return {
      ok: false,
      error: "LEAVE_NOT_FOUND",
      reason: "طلب الإجازة غير موجود في نطاق الشركة.",
      reasonEn: "Leave request was not found in this company.",
    };
  }
  if (request.status && request.status !== "pending") {
    return {
      ok: false,
      error: "LEAVE_NOT_PENDING",
      reason: "لا يمكن اعتماد طلب غير معلّق.",
      reasonEn: "Only pending leave requests can be approved.",
    };
  }
  const hasFile = Array.isArray(request.files) && request.files.length > 0;
  if (leaveNeedsAttachment(request, typeRequiresFile) && !hasFile) {
    return {
      ok: false,
      error: "ATTACHMENT_REQUIRED",
      reason: "لا يمكن الاعتماد — يلزم مستند لطلب يتجاوز 5 أيام (أو لنوع يتطلب مرفقًا).",
      reasonEn: "Approval blocked — a document is required for a request over 5 days (or a type that requires an attachment).",
      days: Number(request.days) || computeLeaveDays(request.startDate, request.endDate),
      threshold: LEAVE_THRESHOLD_DAYS,
    };
  }
  return { ok: true, days: Number(request.days) || computeLeaveDays(request.startDate, request.endDate) };
}

export function deriveLeaveStats(requests) {
  const list = Array.isArray(requests) ? requests : [];
  const pending = list.filter((r) => (r.status || "pending") === "pending");
  const approved = list.filter((r) => r.status === "approved");
  const rejected = list.filter((r) => r.status === "rejected");
  const needsDoc = pending.filter((r) => leaveNeedsAttachment(r) && !(Array.isArray(r.files) && r.files.length));
  return {
    total: list.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    needsDoc: needsDoc.length,
  };
}
