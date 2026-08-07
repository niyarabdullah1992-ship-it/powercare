import React from "react";
import { CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react";

const labels = {
  create_task: ["إنشاء مهمة", "Create task"], log_progress: ["تحديث تقدم مهمة", "Update task progress"],
  report_task_issue: ["تسجيل مشكلة مهمة", "Report task issue"], log_safety_incident: ["تسجيل حادث سلامة", "Log safety incident"],
  create_inventory_item: ["تسجيل صنف مخزون", "Create inventory item"], request_inventory: ["طلب مواد", "Request inventory"],
  issue_inventory: ["صرف مخزون", "Issue inventory"], review_inventory_request: ["مراجعة طلب مواد", "Review material request"],
  review_expense: ["مراجعة مصروف", "Review expense"], submit_leave: ["إرسال طلب إجازة", "Submit leave request"],
  review_leave: ["مراجعة طلب إجازة", "Review leave request"], send_email: ["إرسال بريد", "Send email"],
};

export default function AutomationApprovalCard({ actions, loading, ar, onApprove, onReject }) {
  if (!actions?.length) return null;
  return (
    <section className="rounded-2xl border border-accent/40 bg-accent/5 p-4 shadow-soft" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-start gap-3"><span className="rounded-xl bg-accent/15 p-2 text-accent"><ShieldCheck className="h-5 w-5" /></span><div><h3 className="font-heading text-lg font-semibold">{ar ? "بانتظار موافقتك" : "Waiting for your approval"}</h3><p className="text-xs text-muted-foreground">{ar ? "لن ينفذ نيرو أي إجراء قبل موافقتك." : "Niro will not execute anything before you approve."}</p></div></div>
      <div className="my-4 space-y-2">{actions.map((action, index) => <div key={`${action.type}-${index}`} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-accent" /><span>{labels[action.type]?.[ar ? 0 : 1] || action.title || action.type}</span>{(action.title || action.station) && <span className="truncate text-xs text-muted-foreground">— {action.title || action.station}</span>}</div>)}</div>
      <div className="grid grid-cols-2 gap-2"><button onClick={onReject} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold"><X className="h-4 w-4" />{ar ? "رفض" : "Reject"}</button><button onClick={onApprove} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{ar ? "موافقة وتنفيذ" : "Approve & execute"}</button></div>
    </section>
  );
}