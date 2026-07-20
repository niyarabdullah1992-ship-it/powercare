import React from "react";

export default function CatalogItemForm({ stations, defaultStationId, onSubmit, ar }) {
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (await onSubmit(Object.fromEntries(new FormData(form)))) form.reset();
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
    <div className="md:col-span-2"><h2 className="font-heading text-xl font-semibold">{ar ? "إنشاء صنف" : "Create item"}</h2><p className="text-xs text-muted-foreground">{ar ? "أضف الصنف أولاً، ثم اختر شراءه أو طلبه من محطة أخرى." : "Add the item first, then purchase it or request it from another station."}</p></div>
    <input name="name" required placeholder={ar ? "اسم الصنف" : "Item name"} className="rounded-lg border px-3 py-2" />
    <input name="itemCode" required placeholder={ar ? "كود الصنف" : "Item code"} className="rounded-lg border px-3 py-2" />
    <select name="locationId" required defaultValue={defaultStationId} className="rounded-lg border px-3 py-2"><option value="">{ar ? "اختر المحطة" : "Choose station"}</option>{stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select>
    <input name="minimumStock" type="number" min="0" step="1" defaultValue="0" placeholder={ar ? "الحد الأدنى للمخزون" : "Minimum stock"} className="rounded-lg border px-3 py-2" />
    <button className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground md:col-span-2">{ar ? "حفظ الصنف" : "Save item"}</button>
  </form>;
}