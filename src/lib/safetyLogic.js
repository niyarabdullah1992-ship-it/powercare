import { checklistCompliance } from "@/lib/safetyStandards";

const L = (ar, a, e) => (ar ? a : e);

export function safetyLevelMeta(level, ar = false) {
  if (level === "red") return { key: "red", label: L(ar, "حرجة", "Critical"), accent: "#DC2626", soft: "#FEF2F2", border: "#FECACA", fg: "#DC2626" };
  if (level === "amber") return { key: "amber", label: L(ar, "تحت المراقبة", "Watch"), accent: "#F59E0B", soft: "#FFFBEB", border: "#FDE68A", fg: "#B45309" };
  if (level === "green") return { key: "green", label: L(ar, "آمنة", "Safe"), accent: "#1E9E63", soft: "#ECFDF3", border: "#BBF7D0", fg: "#15803D" };
  return { key: "none", label: L(ar, "غير مقيّمة", "Not assessed"), accent: "#5A6B85", soft: "#F7F8FA", border: "#E2E8F0", fg: "#5A6B85" };
}

function incidentNeedsInspection(rec) {
  if (!rec?.lastIncidentAt) return false;
  const inspectionEnd = rec?.lastInspection ? new Date(rec.lastInspection).setHours(23, 59, 59, 999) : 0;
  return inspectionEnd < new Date(rec.lastIncidentAt).getTime();
}

export function whySafeIsBlocked(rec, ar = false) {
  const reasons = [];
  if (!rec?.lastInspection) reasons.push(L(ar, "أدخل تاريخ آخر تفتيش", "Enter the last inspection date"));
  else if (new Date(rec.lastInspection) > new Date()) reasons.push(L(ar, "تاريخ التفتيش مستقبلي", "Inspection date is in the future"));
  const open = (rec?.hazards || []).length;
  if (open) reasons.push(L(ar, `أغلق ${open} مخاطر مفتوحة`, `Close ${open} open hazards`));
  if (incidentNeedsInspection(rec)) reasons.push(L(ar, "يلزم تفتيش جديد بعد آخر حادث", "A new inspection is required after the latest incident"));
  return reasons;
}

export function safetyApprovalIssues(rec, ar = false) {
  const issues = [];
  if (!rec?.level) issues.push(L(ar, "لم يتم تحديد مستوى السلامة", "Safety level is not selected"));
  if (!rec?.lastInspection) issues.push(L(ar, "لم يُدخل تاريخ آخر تفتيش", "Last inspection date is missing"));
  if (rec?.lastInspection && new Date(rec.lastInspection) > new Date()) issues.push(L(ar, "تاريخ التفتيش مستقبلي", "Inspection date is in the future"));
  if ((rec?.hazards || []).length) issues.push(L(ar, `${rec.hazards.length} مخاطر مفتوحة`, `${rec.hazards.length} open hazards`));
  const incompleteRisks = (rec?.riskItems || []).filter((item) => !item.correctiveAction?.trim() || !Number(item.probability) || !Number(item.severity)).length;
  if (incompleteRisks) issues.push(L(ar, `${incompleteRisks} عنصر مخاطر بدون تقييم أو إجراء تصحيحي`, `${incompleteRisks} risk items lack an assessment or corrective action`));
  const compliance = checklistCompliance(rec?.checklistResults || {});
  if (compliance < 70) issues.push(L(ar, `قوائم التحقق مكتملة بنسبة ${compliance}% فقط`, `Checklist compliance is only ${compliance}%`));
  const expiredPermits = (rec?.permits || []).filter((permit) => permit.status !== "cancelled" && new Date(permit.validUntil).getTime() < Date.now()).length;
  if (expiredPermits) issues.push(L(ar, `${expiredPermits} تصاريح نشطة منتهية الصلاحية`, `${expiredPermits} active permits have expired`));
  if (incidentNeedsInspection(rec)) issues.push(L(ar, "يلزم تفتيش جديد بعد آخر حادثة", "A new inspection is required after the latest incident"));
  return issues;
}

export function canSetSafetyLevelSafe(rec) {
  return whySafeIsBlocked(rec).length === 0;
}

export function safetyIncidentCount(rec) {
  return (rec?.incidentLog || []).length;
}