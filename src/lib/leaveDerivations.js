/** Client helpers aligned with base44/shared/leaveDerivations.ts */

export const LEAVE_THRESHOLD_DAYS = 5;

export function computeLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const a = new Date(`${String(startDate).slice(0, 10)}T00:00:00`);
  const b = new Date(`${String(endDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function leaveNeedsAttachment(request, typeRequiresFile = false) {
  const days = Number(request?.days) || computeLeaveDays(request?.startDate, request?.endDate);
  if (typeRequiresFile) return true;
  return days > LEAVE_THRESHOLD_DAYS;
}

export function checkApproveLeaveGate(request, typeRequiresFile = false) {
  if (!request) {
    return { ok: false, error: "LEAVE_NOT_FOUND", reason: "طلب الإجازة غير موجود." };
  }
  if (request.status && request.status !== "pending") {
    return { ok: false, error: "LEAVE_NOT_PENDING", reason: "لا يمكن اعتماد طلب غير معلّق." };
  }
  const hasFile = Array.isArray(request.files) && request.files.length > 0;
  if (leaveNeedsAttachment(request, typeRequiresFile) && !hasFile) {
    return {
      ok: false,
      error: "ATTACHMENT_REQUIRED",
      reason: "لا يمكن الاعتماد — يلزم مستند لطلب يتجاوز 5 أيام.",
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
