import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import DeductionLineForm from "@/components/payroll/DeductionLineForm";
import DeductionDisputeForm from "@/components/payroll/DeductionDisputeForm";
import { deductionLines, deductionsTotal, sourceLabel } from "@/lib/payrollDeductions";

// The deduction breakdown: every line carries its source, reason, author and dispute state.
export default function DeductionLinesDialog({ open, onOpenChange, item, employeeName, ar, canEdit, onAdd, onRemove, onResolve, currentUserId, onDispute }) {
  if (!item) return null;
  const lines = deductionLines(item);
  const total = deductionsTotal(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            {ar ? "بنود الخصم" : "Deduction lines"} — {employeeName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border border-accent/35 bg-accent/10 p-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-xs font-body text-foreground">
            {ar ? "لا يُخصم مبلغ بلا بند موثّق — الإجمالي محسوب من البنود أدناه." : "No amount is deducted without a documented line — the total is computed from the lines below."}
          </p>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm font-body text-muted-foreground">
              {ar ? "لا توجد بنود خصم لهذا الشهر." : "No deduction lines this month."}
            </p>
          ) : lines.map((line) => (
            <div key={line.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-body font-semibold">
                    <span dir="ltr">{Number(line.amount).toLocaleString()} {item.currency}</span>
                    <span className="ms-2 text-[11px] font-normal text-accent-text">{sourceLabel(line.source, ar)}</span>
                  </p>
                  {line.reason && <p className="mt-1 text-xs font-body text-muted-foreground">{line.reason}</p>}
                  {line.sourceRefId && <p className="text-[11px] font-body text-muted-foreground" dir="ltr">ref: {line.sourceRefId}</p>}
                  <p className="mt-1 text-[11px] font-body text-muted-foreground">
                    {line.createdByName || line.createdBy} · {new Date(line.createdAt).toLocaleDateString()}
                  </p>
                  {line.disputeStatus === "open" && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-body text-destructive">
                      <AlertTriangle className="h-3 w-3" /> {ar ? "اعتراض مفتوح" : "Dispute open"}
                      {line.disputeNote && <span className="text-muted-foreground">— {line.disputeNote}</span>}
                    </p>
                  )}
                  {line.disputeStatus === "accepted" && (
                    <p className="mt-1 text-[11px] font-body text-emerald-600">{ar ? "اعتراض مقبول — أُلغي الخصم" : "Dispute accepted — deduction cancelled"}</p>
                  )}
                  {line.disputeStatus === "rejected" && (
                    <p className="mt-1 text-[11px] font-body text-muted-foreground">{ar ? "اعتراض مرفوض" : "Dispute rejected"}</p>
                  )}
                </div>
                {canEdit && (
                  <button type="button" onClick={() => onRemove(line.id)} title={ar ? "حذف البند" : "Remove line"}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {canEdit && line.disputeStatus === "open" && (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => onResolve(line.id, "accepted")} className="rounded-md border border-border px-2.5 py-1 text-xs font-body hover:bg-muted">
                    {ar ? "قبول الاعتراض وإلغاء الخصم" : "Accept & cancel deduction"}
                  </button>
                  <button type="button" onClick={() => onResolve(line.id, "rejected")} className="rounded-md border border-border px-2.5 py-1 text-xs font-body hover:bg-muted">
                    {ar ? "رفض الاعتراض" : "Reject dispute"}
                  </button>
                </div>
              )}
              {onDispute && item.employeeId === currentUserId && !item.paid && line.disputeStatus === "none" && Number(line.amount) > 0 && (
                <DeductionDisputeForm ar={ar} onSubmit={(note) => onDispute(line.id, note)} />
              )}
            </div>
          ))}
        </div>

        <p className="text-sm font-body font-semibold">
          {ar ? "إجمالي الخصم" : "Total deduction"}: <span dir="ltr">{total.toLocaleString()} {item.currency}</span>
        </p>

        {canEdit && !item.paid && <DeductionLineForm ar={ar} onAdd={onAdd} />}
        {item.paid && (
          <p className="text-xs font-body text-muted-foreground">
            {ar ? "الراتب مدفوع — البنود مغلقة للتعديل." : "Salary is paid — lines are locked."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}