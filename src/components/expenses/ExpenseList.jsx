import React from "react";
import { ExternalLink } from "lucide-react";

const TYPE = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };
const STATUS = { submitted: ["Manager review", "مراجعة المدير"], manager_approved: ["Finance review", "مراجعة المالية"], manager_rejected: ["Manager rejected", "مرفوض من المدير"], finance_approved: ["Approved", "معتمد"], finance_rejected: ["Finance rejected", "مرفوض من المالية"] };

export default function ExpenseList({ claims, canManagerReview, canFinanceReview, onManagerReview, onFinanceReview, ar }) {
  if (!claims.length) return <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{ar ? "لا توجد مصروفات بعد." : "No expenses yet."}</div>;
  return <div className="space-y-3">{claims.map((claim) => <article key={claim.id} className="rounded-2xl border border-border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{TYPE[claim.expenseType]?.[ar ? 1 : 0]}</h3><p className="text-xs text-muted-foreground">{claim.requesterName} · {claim.expenseDate}</p></div><div className="text-end"><p className="font-heading text-xl font-semibold">{Number(claim.amount).toLocaleString()} {claim.currency}</p><span className="rounded-full bg-secondary px-2 py-1 text-xs">{STATUS[claim.status]?.[ar ? 1 : 0]}</span></div></div>
    {claim.description && <p className="mt-3 text-sm text-muted-foreground">{claim.description}</p>}
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3"><a href={claim.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-accent hover:underline"><ExternalLink className="h-4 w-4" />{ar ? "عرض الإيصال" : "View receipt"}</a>
      {canManagerReview && claim.status === "submitted" && <><button onClick={() => onManagerReview(claim.id, "manager_approved")} className="ms-auto rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-foreground">{ar ? "اعتماد" : "Approve"}</button><button onClick={() => onManagerReview(claim.id, "manager_rejected")} className="rounded-lg border border-destructive px-3 py-1.5 text-sm text-destructive">{ar ? "رفض" : "Reject"}</button></>}
      {canFinanceReview && claim.status === "manager_approved" && <><button onClick={() => onFinanceReview(claim.id, "finance_approved")} className="ms-auto rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-foreground">{ar ? "اعتماد نهائي" : "Final approve"}</button><button onClick={() => onFinanceReview(claim.id, "finance_rejected")} className="rounded-lg border border-destructive px-3 py-1.5 text-sm text-destructive">{ar ? "رفض" : "Reject"}</button></>}
    </div>
  </article>)}</div>;
}