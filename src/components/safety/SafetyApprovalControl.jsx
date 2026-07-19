import React from "react";
import { BadgeCheck } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";
import FlowSwipeAction from "@/components/flow/FlowSwipeAction";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function SafetyApprovalControl({ rec, canApprove, approvalIssues, lang, onApprove, onRevoke }) {
  const ar = lang === "ar";
  const L = (a, e) => ar ? a : e;
  if (rec?.approvedBy) {
    const approvedAt = new Date(rec.approvedAt).getTime();
    const canRevoke = canApprove && Number.isFinite(approvedAt) && Date.now() - approvedAt >= 0 && Date.now() - approvedAt <= DAY_MS;
    return <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground"><BadgeCheck className="me-1 inline h-3.5 w-3.5 text-emerald-600" />{L("اعتمده", "Approved by")} <strong>{rec.approvedBy}</strong>{rec.approvedAt && ` — ${formatDateTime(rec.approvedAt, lang)}`}</p>
      {canRevoke && <FlowSwipeAction sensitive label={L("اسحب للتراجع عن الاعتماد", "Swipe to revoke approval")} onAction={onRevoke} confirmLabel={L("تأكيد التراجع", "Confirm revocation")} cancelLabel={L("إلغاء", "Cancel")} />}
    </div>;
  }
  if (canApprove && approvalIssues.length === 0) return <FlowSwipeAction sensitive label={L("اسحب لاعتماد بيانات السلامة", "Swipe to approve safety data")} onAction={onApprove} confirmLabel={L("تأكيد الاعتماد", "Confirm approval")} cancelLabel={L("إلغاء", "Cancel")} />;
  return <p className="text-[10px] text-red-600">{approvalIssues[0] || L("بانتظار اعتماد الإدارة", "Awaiting approval")}</p>;
}