import React, { useState } from "react";
import { FileSpreadsheet, FileText, ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { subscriptionTotals, subscriptionBillableAmount, formatSubscriptionMoney } from "@/lib/subscriptionTax";
import { exportSubscriptionInvoicesExcel, printSubscriptionInvoices, subscriptionInvoiceNumber } from "@/lib/subscriptionInvoiceExport";

export default function SubscriptionInvoice({ row, ar }) {
  const [open, setOpen] = useState(false);
  const amount = row.amount ?? row.customPrice;
  if (amount == null && !row.exempt && !row.isFree && row.plan !== "Free") return <span className="text-muted-foreground">—</span>;
  const currency = row.currency || "USD";
  const totals = subscriptionTotals(subscriptionBillableAmount(row));
  const invoiceNumber = subscriptionInvoiceNumber(row);
  const issueDate = new Date(row.startedAt || Date.now()).toLocaleDateString(ar ? "ar-SA" : "en-GB");
  const money = (value) => formatSubscriptionMoney(value, currency, ar);
  const lines = [
    [ar ? "المبلغ قبل الضريبة" : "Subtotal before VAT", money(totals.subtotal)],
    [ar ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)", money(totals.vat)],
  ];

  return <>
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-landing-gold/30 px-2.5 py-1.5 text-xs font-medium text-landing-gold-deep hover:bg-secondary"><ReceiptText className="h-3.5 w-3.5" />{ar ? "الفاتورة" : "Invoice"}</button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
      <DialogHeader><DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-landing-gold" />{ar ? "فاتورة الاشتراك" : "Subscription invoice"}</DialogTitle></DialogHeader>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="bg-primary p-5 text-primary-foreground"><div className="flex justify-between gap-4 text-xs opacity-70"><span>{invoiceNumber}</span><span>{issueDate}</span></div><p className="mt-4 text-xs opacity-70">{ar ? "العميل" : "Customer"}</p><h3 className="mt-1 font-heading text-xl">{row.companyName || "—"}</h3><p className="mt-1 text-xs opacity-70" dir="ltr">{row.email || "—"}</p><p className="mt-2 text-xs opacity-70">{row.plan} · {row.billing === "yearly" ? (ar ? "سنوي" : "Yearly") : (ar ? "شهري" : "Monthly")}</p></div>
        <div className="space-y-3 p-5">{lines.map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><strong dir="ltr">{value}</strong></div>)}<div className="flex justify-between gap-4 border-t border-border pt-4"><span className="font-semibold">{ar ? "الإجمالي شامل الضريبة" : "Total including VAT"}</span><strong className="text-lg text-landing-gold-deep" dir="ltr">{money(totals.total)}</strong></div></div>
      </div>
      <div className="grid grid-cols-2 gap-2"><button onClick={() => printSubscriptionInvoices([row], ar, `${ar ? "فاتورة" : "Invoice"} ${invoiceNumber}`)} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"><FileText className="h-4 w-4" />PDF</button><button onClick={() => exportSubscriptionInvoicesExcel([row], ar, invoiceNumber)} className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold hover:bg-muted"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Excel</button></div>
    </DialogContent></Dialog>
  </>;
}