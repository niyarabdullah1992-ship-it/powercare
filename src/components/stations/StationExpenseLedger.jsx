import React, { useEffect, useState } from "react";
import { ExternalLink, Loader2, ReceiptText, X } from "lucide-react";
import { expensesCall } from "@/lib/expensesApi";

const TYPES = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };

export default function StationExpenseLedger({ station, session, ar, onClose }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    expensesCall(session, "list").then((result) => {
      setClaims(result.claims.filter((claim) => (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).includes(station.id)));
    }).finally(() => setLoading(false));
  }, [session, station.id]);
  const total = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
    <section className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-elevated" onClick={(event) => event.stopPropagation()}>
      <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-heading text-2xl font-semibold">{ar ? `سجل مصروفات ${station.name}` : `${station.name} Expense Ledger`}</h2><p className="text-sm text-muted-foreground">{claims.length} {ar ? "عملية" : "entries"} · {total.toLocaleString()} SAR</p></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
      {loading ? <Loader2 className="mx-auto my-12 h-6 w-6 animate-spin text-accent" /> : claims.length ? <div className="space-y-3">{claims.map((claim) => <article key={claim.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{claim.expenseType === "other" ? claim.customExpenseType : TYPES[claim.expenseType]?.[ar ? 1 : 0]}</h3><p className="text-xs text-muted-foreground">{claim.requesterName} · {claim.expenseDate}</p></div><strong className="font-heading text-lg">{Number(claim.amount).toLocaleString()} {claim.currency}</strong></div>{claim.description && <p className="mt-2 text-sm text-muted-foreground">{claim.description}</p>}<a href={claim.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1 text-sm text-accent hover:underline"><ExternalLink className="h-4 w-4" />{ar ? "عرض الإيصال" : "View receipt"}</a></article>)}</div> : <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground"><ReceiptText className="mx-auto mb-2 h-6 w-6" />{ar ? "لا توجد مصروفات لهذه المحطة." : "No expenses for this station."}</div>}
    </section>
  </div>;
}