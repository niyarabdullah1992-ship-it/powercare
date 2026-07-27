import React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InvoiceStatusBadge from "@/components/owner/InvoiceStatusBadge";
import InvoiceAuditTimeline from "@/components/owner/InvoiceAuditTimeline";

const money = (value, currency, ar) => new Intl.NumberFormat(ar ? "ar-SA" : "en-US", { style: "currency", currency }).format((value || 0) / 100);
export default function InvoiceDetailsDialog({ invoice, onClose, ar, onAudit }) {
  if (!invoice) return null;
  const row = (label, value) => <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><strong dir="ltr">{value}</strong></div>;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-lg" dir={ar ? "rtl" : "ltr"}><DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />{invoice.number}</DialogTitle></DialogHeader>
    <div className="rounded-xl bg-primary p-4 text-primary-foreground"><div className="flex justify-between gap-3"><div><p className="text-xs opacity-65">{ar ? "العميل" : "Customer"}</p><p className="font-heading text-xl">{invoice.companyName || "—"}</p><p className="text-xs opacity-65" dir="ltr">{invoice.email}</p></div><InvoiceStatusBadge status={invoice.status} ar={ar} /></div></div>
    <div className="space-y-3 rounded-xl border border-border p-4">{row(ar ? "قبل الضريبة" : "Subtotal", money(invoice.subtotal, invoice.currency, ar))}{row(ar ? "الضريبة" : "Tax", money(invoice.tax, invoice.currency, ar))}{row(ar ? "الإجمالي" : "Total", money(invoice.total, invoice.currency, ar))}{row(ar ? "المدفوع" : "Paid", money(invoice.amountPaid, invoice.currency, ar))}{row(ar ? "المتبقي" : "Balance due", money(invoice.amountDue, invoice.currency, ar))}</div>
    <div className="rounded-xl border border-border p-4"><h3 className="mb-3 font-semibold">{ar ? "السجل الزمني القانوني" : "Invoice audit timeline"}</h3><InvoiceAuditTimeline invoice={invoice} ar={ar} /></div>
    <div className="grid grid-cols-2 gap-2">{invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" onClick={() => onAudit("exported_pdf", invoice)} className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"><FileText className="h-4 w-4" />PDF</a>}{invoice.hostedUrl && <a href={invoice.hostedUrl} target="_blank" rel="noreferrer" onClick={() => onAudit("hosted_opened", invoice)} className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-xs font-semibold"><ExternalLink className="h-4 w-4" />{ar ? "النسخة الإلكترونية" : "Hosted invoice"}</a>}</div>
  </DialogContent></Dialog>;
}