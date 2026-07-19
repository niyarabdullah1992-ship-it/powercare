import React from "react";

export default function MaterialRequestForm({ items, stationId, centralWarehouseId, onSubmit, ar }) {
  const submit = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (await onSubmit(Object.fromEntries(form))) event.currentTarget.reset(); };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
    <input type="hidden" name="stationId" value={stationId} />
    <select name="itemId" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "اختر قطعة الغيار" : "Choose an item"}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} ({Number(item.locationBalances?.find((balance) => balance.locationId === centralWarehouseId)?.quantity || 0)})</option>)}</select>
    <input name="quantity" type="number" min="1" defaultValue="1" required className="rounded-lg border px-3 py-2" />
    <input name="notes" required placeholder={ar ? "سبب الطلب" : "Request reason"} className="rounded-lg border px-3 py-2" />
    <button className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">{ar ? "إرسال الطلب" : "Submit request"}</button>
  </form>;
}