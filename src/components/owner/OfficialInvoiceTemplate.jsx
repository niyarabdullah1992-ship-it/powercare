import React from "react";
import { Image } from "@/components/ui/image";
import { POWERCARE_LOGO_URL } from "@/lib/brand";
import InvoiceStatusBadge from "@/components/owner/InvoiceStatusBadge";

const money = (value, currency, ar) => new Intl.NumberFormat(ar ? "ar-SA" : "en-US", { style: "currency", currency: currency || "SAR" }).format((value || 0) / 100);
export default function OfficialInvoiceTemplate({ invoice, ar }) {
  const detail = (label, value, ltr = false) => <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold" dir={ltr ? "ltr" : "auto"}>{value || "—"}</p></div>;
  return <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <div className="h-2 bg-gradient-to-r from-primary via-primary to-accent" />
    <header className="flex items-start justify-between gap-4 border-b border-border p-5">
      <div className="flex items-center gap-3"><Image src={POWERCARE_LOGO_URL} alt="PowerCare" originWidth={1024} originHeight={1024} fittingType="fit" className="h-14 w-14" /><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">PowerCare</p><h2 className="font-heading text-2xl">{ar ? "فاتورة ضريبية" : "Tax Invoice"}</h2></div></div>
      <div className="text-end"><p className="font-mono text-xs text-muted-foreground">{invoice.number}</p><div className="mt-2"><InvoiceStatusBadge status={invoice.status} ar={ar} /></div></div>
    </header>
    <div className="grid gap-5 p-5 sm:grid-cols-2">
      <section className="rounded-lg bg-muted/50 p-4"><p className="mb-3 text-xs font-bold text-accent">{ar ? "تفاصيل العميل" : "Bill to"}</p><div className="space-y-3">{detail(ar ? "اسم الشركة" : "Company", invoice.companyName)}{detail(ar ? "البريد الإلكتروني" : "Email", invoice.email, true)}{detail(ar ? "معرّف العميل" : "Customer ID", invoice.companyId, true)}</div></section>
      <section className="rounded-lg bg-muted/50 p-4"><p className="mb-3 text-xs font-bold text-accent">{ar ? "بيانات الفاتورة" : "Invoice details"}</p><div className="grid grid-cols-2 gap-3">{detail(ar ? "تاريخ الإصدار" : "Issue date", new Date(invoice.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB"))}{detail(ar ? "العملة" : "Currency", invoice.currency, true)}{detail(ar ? "الباقة" : "Plan", invoice.plan)}{detail(ar ? "دورة الفوترة" : "Billing cycle", invoice.billing === "yearly" ? (ar ? "سنوية" : "Yearly") : (ar ? "شهرية" : "Monthly"))}</div></section>
    </div>
    <div className="mx-5 overflow-hidden rounded-lg border border-border"><div className="grid grid-cols-[1fr,auto] bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground"><span>{ar ? "الوصف" : "Description"}</span><span>{ar ? "القيمة" : "Amount"}</span></div><div className="grid grid-cols-[1fr,auto] px-4 py-4 text-sm"><span>{ar ? `اشتراك PowerCare — ${invoice.plan || "—"}` : `PowerCare subscription — ${invoice.plan || "—"}`}</span><strong>{money(invoice.subtotal, invoice.currency, ar)}</strong></div></div>
    <div className="flex justify-end p-5"><div className="w-full max-w-xs space-y-2">{[[ar ? "المجموع قبل الضريبة" : "Subtotal", invoice.subtotal], [ar ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)", invoice.tax]].map(([label, value]) => <div key={label} className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><strong>{money(value, invoice.currency, ar)}</strong></div>)}<div className="flex justify-between border-t-2 border-accent pt-3 text-lg"><strong>{ar ? "الإجمالي" : "Total"}</strong><strong>{money(invoice.total, invoice.currency, ar)}</strong></div></div></div>
    <footer className="flex flex-wrap justify-between gap-2 border-t border-border bg-muted/40 px-5 py-3 text-[10px] text-muted-foreground"><span>{ar ? "مرجع الدفع" : "Payment reference"}: {invoice.paymentReference || "—"}</span><span>{ar ? "صادرة إلكترونيًا بواسطة PowerCare" : "Electronically issued by PowerCare"}</span></footer>
  </article>;
}