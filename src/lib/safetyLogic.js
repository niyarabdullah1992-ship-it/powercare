import { checklistCompliance } from "@/lib/safetyStandards";

export function safetyApprovalIssues(rec, ar = false) {
  const L = (a, e) => (ar ? a : e);
  const issues = [];
  if (!rec?.level) issues.push(L("لم يتم تحديد مستوى السلامة", "Safety level is not selected"));
  if (!rec?.lastInspection) issues.push(L("لم يُدخل تاريخ آخر تفتيش", "Last inspection date is missing"));
  if (rec?.lastInspection && new Date(rec.lastInspection) > new Date()) issues.push(L("تاريخ التفتيش مستقبلي", "Inspection date is in the future"));
  if ((rec?.hazards || []).length) issues.push(L(`${rec.hazards.length} مخاطر مفتوحة`, `${rec.hazards.length} open hazards`));
  const incompleteRisks = (rec?.riskItems || []).filter((item) => !item.correctiveAction?.trim() || !Number(item.probability) || !Number(item.severity)).length;
  if (incompleteRisks) issues.push(L(`${incompleteRisks} عنصر مخاطر بدون تقييم أو إجراء تصحيحي`, `${incompleteRisks} risk items lack an assessment or corrective action`));
  const compliance = checklistCompliance(rec?.checklistResults || {});
  if (compliance < 70) issues.push(L(`قوائم التحقق مكتملة بنسبة ${compliance}% فقط`, `Checklist compliance is only ${compliance}%`));
  const expiredPermits = (rec?.permits || []).filter((permit) => permit.status !== "cancelled" && new Date(permit.validUntil).getTime() < Date.now()).length;
  if (expiredPermits) issues.push(L(`${expiredPermits} تصاريح نشطة منتهية الصلاحية`, `${expiredPermits} active permits have expired`));
  const inspectionEnd = rec?.lastInspection ? new Date(rec.lastInspection).setHours(23, 59, 59, 999) : 0;
  if (rec?.lastIncidentAt && inspectionEnd < new Date(rec.lastIncidentAt).getTime()) issues.push(L("يلزم تفتيش جديد بعد آخر حادثة", "A new inspection is required after the latest incident"));
  return issues;
}

export function canSetSafetyLevelSafe(rec) {
  if ((rec?.hazards || []).length || !rec?.lastInspection || new Date(rec.lastInspection) > new Date()) return false;
  return !rec?.lastIncidentAt || new Date(rec.lastInspection).setHours(23, 59, 59, 999) >= new Date(rec.lastIncidentAt).getTime();
}

export function safetyIncidentCount(rec) {
  return (rec?.incidentLog || []).length;
}