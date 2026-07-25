import React from "react";
import { subscriptionTotals, formatSubscriptionMoney } from "@/lib/subscriptionTax";

export default function SubscriptionRevenueSummary({ amount = 0, ar }) {
  const totals = subscriptionTotals(amount);
  const items = [
    { label: ar ? "الإيراد الشهري قبل الضريبة" : "Monthly revenue before VAT", value: totals.subtotal },
    { label: ar ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)", value: totals.vat },
    { label: ar ? "الإجمالي الشهري شامل الضريبة" : "Monthly total including VAT", value: totals.total, total: true },
  ];

  return <section className="grid gap-3 sm:grid-cols-3">
    {items.map((item) => <div key={item.label} className={`rounded-xl border p-4 shadow-soft ${item.total ? "border-accent/40 bg-primary text-primary-foreground" : "border-border bg-card"}`}>
      <p className={`text-xs ${item.total ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{item.label}</p>
      <p className={`mt-2 font-heading text-2xl font-semibold ${item.total ? "text-accent" : "text-foreground"}`}>{formatSubscriptionMoney(item.value, "USD", ar)}</p>
    </div>)}
  </section>;
}