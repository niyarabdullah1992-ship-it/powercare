import React from "react";

const styles = { paid: "bg-emerald-100 text-emerald-700", open: "bg-amber-100 text-amber-700", draft: "bg-blue-100 text-blue-700", void: "bg-slate-200 text-slate-700", uncollectible: "bg-red-100 text-red-700" };
const arLabels = { paid: "مدفوعة", open: "مستحقة", draft: "مسودة", void: "ملغاة", uncollectible: "متعذرة التحصيل" };
export default function InvoiceStatusBadge({ status, ar }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status] || styles.draft}`}>{ar ? (arLabels[status] || status) : String(status || "draft").replaceAll("_", " ")}</span>;
}