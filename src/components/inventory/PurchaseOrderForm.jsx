import React from "react";

export default function PurchaseOrderForm({ request, onSubmit, onClose, ar }) {
  if (!request) return null;
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const items = request.items.map((item, index) => ({ ...item, unitPrice: Number(form.get(`price_${index}`)) }));
    onSubmit({ requestId: request.id, supplierName: form.get("supplierName"), items });
  };
  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-accent bg-card p-4">
    <div className="flex justify-between"><h2 className="font-heading text-xl font-semibold">{ar ? "إصدار أمر شراء" : "Issue purchase order"} · {request.requestNumber}</h2><button type="button" onClick={onClose}>×</button></div>
    <input name="supplierName" required placeholder={ar ? "اسم المورد" : "Supplier name"} className="w-full rounded-lg border px-3 py-2" />
    {request.items.map((item, index) => <label key={index} className="grid gap-2 text-sm md:grid-cols-3 md:items-center"><span>{item.name} · {item.quantity}</span><span className="text-muted-foreground">{ar ? "سعر الوحدة الفعلي" : "Actual unit price"}</span><input name={`price_${index}`} type="number" min="0" step="0.01" required defaultValue={item.estimatedUnitCost || 0} className="rounded-lg border px-3 py-2" /></label>)}
    <button className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">{ar ? "إصدار الأمر" : "Issue order"}</button>
  </form>;
}