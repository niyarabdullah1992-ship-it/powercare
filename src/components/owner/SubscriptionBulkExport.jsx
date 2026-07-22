import React from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportSubscriptionInvoicesExcel, printSubscriptionInvoices } from "@/lib/subscriptionInvoiceExport";

export default function SubscriptionBulkExport({ rows, ar }) {
  const invoiceRows = rows.filter((row) => (row.amount ?? row.customPrice) != null);
  return <div className="flex flex-wrap gap-2">
    <button disabled={!invoiceRows.length} onClick={() => printSubscriptionInvoices(invoiceRows, ar)} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40"><FileText className="h-4 w-4 text-landing-gold" />{ar ? "PDF لجميع الفواتير" : "All invoices PDF"}</button>
    <button disabled={!invoiceRows.length} onClick={() => exportSubscriptionInvoicesExcel(invoiceRows, ar)} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />{ar ? "Excel لجميع الفواتير" : "All invoices Excel"}</button>
  </div>;
}