export function safetyApprovalIssues(rec, ar = false) {
  const L = (a, e) => (ar ? a : e);
  const issues = [];
  if (!rec?.level) issues.push(L("حدد مستوى السلامة", "Select a safety level"));
  if (!rec?.lastInspection) issues.push(L("أدخل تاريخ آخر تفتيش", "Enter the last inspection date"));
  if (rec?.lastInspection && new Date(rec.lastInspection) > new Date()) issues.push(L("تاريخ التفتيش لا يمكن أن يكون مستقبليًا", "Inspection date cannot be in the future"));
  if ((rec?.hazards || []).length) issues.push(L("أغلق جميع المخاطر أولًا", "Close all hazards first"));
  const inspectionEnd = rec?.lastInspection ? new Date(rec.lastInspection).setHours(23, 59, 59, 999) : 0;
  if (rec?.lastIncidentAt && inspectionEnd < new Date(rec.lastIncidentAt).getTime()) {
    issues.push(L("يلزم تفتيش جديد بعد آخر حادثة", "A new inspection is required after the latest incident"));
  }
  return issues;
}

export function canSetSafetyLevelSafe(rec) {
  if ((rec?.hazards || []).length || !rec?.lastInspection || new Date(rec.lastInspection) > new Date()) return false;
  return !rec?.lastIncidentAt || new Date(rec.lastInspection).setHours(23, 59, 59, 999) >= new Date(rec.lastIncidentAt).getTime();
}

export function safetyIncidentCount(rec) {
  return (rec?.incidentLog || []).length;
}