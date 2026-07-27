import React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InvoiceAuditTimeline from "@/components/owner/InvoiceAuditTimeline";
import { printOfficialInvoice } from "@/lib/officialInvoicePdf";
import OfficialInvoiceTemplate from "@/components/owner/OfficialInvoiceTemplate";

export default function InvoiceDetailsDialog({ invoice, onClose, ar, onAudit }) {
  if (!invoice) return null;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}><DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />{invoice.number}</DialogTitle></DialogHeader>
    <OfficialInvoiceTemplate invoice={invoice} ar={ar} />
    <div className="rounded-xl border border-border p-4"><h3 className="mb-3 font-semibold">{ar ? "السجل الزمني القانوني" : "Invoice audit timeline"}</h3><InvoiceAuditTimeline invoice={invoice} ar={ar} /></div>
    <div className={invoice.hostedUrl ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}><button onClick={() => { onAudit("exported_pdf", invoice); printOfficialInvoice(invoice, ar); }} className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"><FileText className="h-4 w-4" />PDF</button>{invoice.hostedUrl && <a href={invoice.hostedUrl} target="_blank" rel="noreferrer" onClick={() => onAudit("hosted_opened", invoice)} className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-xs font-semibold"><ExternalLink className="h-4 w-4" />{ar ? "النسخة الإلكترونية" : "Hosted invoice"}</a>}</div>
  </DialogContent></Dialog>;
}