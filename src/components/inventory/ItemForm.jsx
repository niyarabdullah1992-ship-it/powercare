import React, { useState } from "react";

export default function ItemForm({ stations, defaultStationId, onSubmit, ar }) {
  const [mode, setMode] = useState("quantity");
  const submit = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (await onSubmit(Object.fromEntries(form))) { event.currentTarget.reset(); setMode("quantity"); } };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <input name="name" required placeholder={ar ? "اسم الصنف" : "Item name"} className="rounded-lg border px-3 py-2" />
    <input name="itemCode" required placeholder={ar ? "كود الصنف" : "Item code"} className="rounded-lg border px-3 py-2" />
    <select name="trackingMode" value={mode} onChange={(event) => setMode(event.target.value)} className="rounded-lg border px-3 py-2"><option value="quantity">{ar ? "بالكميات" : "Quantity"}</option><option value="serialized">{ar ? "رقم تسلسلي لكل قطعة" : "Serialized"}</option></select>
    <select name="locationId" required defaultValue={defaultStationId || ""} className="rounded-lg border px-3 py-2"><option value="">{ar ? "المحطة الحالية" : "Current station"}</option>{stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select>
    <input name="minimumStock" type="number" min="0" defaultValue="1" required placeholder={ar ? "الحد الأدنى" : "Minimum stock"} className="rounded-lg border px-3 py-2" />
    {mode === "quantity" ? <input name="quantity" type="number" min="0" defaultValue="0" placeholder={ar ? "الكمية الافتتاحية" : "Opening quantity"} className="rounded-lg border px-3 py-2" /> : <input name="serialNumber" placeholder={ar ? "الرقم التسلسلي الأول" : "First serial number"} className="rounded-lg border px-3 py-2" />}
    <button className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">{ar ? "إضافة الصنف" : "Add item"}</button>
  </form>;
}