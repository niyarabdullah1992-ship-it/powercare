import React, { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportSubscriptionInvoicesExcel, printSubscriptionInvoices } from "@/lib/subscriptionInvoiceExport";

export default function SubscriptionBulkExport({ rows, ar }) {
  const [open, setOpen] = useState(false);
  const invoiceRows = rows.filter((row) => (row.amount ?? row.customPrice) != null);
  return <div className="space-y-3">
    <button type="button" onClick={() => setOpen(!open)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body transition ${open ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}><FileText className="h-3.5 w-3.5" />{ar ? "تقرير الاشتراكات (PDF / Excel)" : "Subscriptions report (PDF / Excel)"}</button>
    {open && <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
      <button disabled={!invoiceRows.length} onClick={() => printSubscriptionInvoices(invoiceRows, ar)} className="flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-xs font-body hover:bg-muted disabled:opacity-40"><FileText className="h-4 w-4" />PDF</button>
      <button disabled={!invoiceRows.length} onClick={() => exportSubscriptionInvoicesExcel(invoiceRows, ar)} className="flex items-center gap-2 rounded-md border border-emerald-300 px-3.5 py-2 text-xs font-body text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"><FileSpreadsheet className="h-4 w-4" />Excel</button>
    </div>}
  </div>;
}