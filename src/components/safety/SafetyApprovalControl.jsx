import React from "react";
import { AlertTriangle, BadgeCheck } from "lucide-react";
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
  if (canApprove) return <div className="space-y-2">
    {approvalIssues.length > 0 && <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-amber-800"><p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold"><AlertTriangle className="h-3.5 w-3.5" />{L("تحذيرات قبل الاعتماد", "Warnings before approval")}</p><ul className="list-disc space-y-1 ps-4 text-[10px]">{approvalIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
    <FlowSwipeAction sensitive label={L("اسحب لاعتماد بيانات السلامة", "Swipe to approve safety data")} onAction={onApprove} confirmLabel={L("تأكيد المتابعة والاعتماد", "Confirm and approve")} cancelLabel={L("إلغاء", "Cancel")} />
  </div>;
  return <p className="text-[10px] text-muted-foreground">{L("بانتظار اعتماد الإدارة", "Awaiting approval")}</p>;
}