import React, { useState } from "react";

export default function MovementForm({ items, stations, transferStations = stations, stationId, centralWarehouseId, warehouseMode = true, onSubmit, ar }) {
  const [type, setType] = useState(warehouseMode ? "receive" : "transfer");
  const source = stations.find((station) => station.stationId === stationId);
  const warehouse = transferStations.find((station) => station.stationId === centralWarehouseId);
  const destinations = transferStations.filter((station) => station.stationId !== stationId);
  const submit = async (event) => { event.preventDefault(); if (await onSubmit(type, Object.fromEntries(new FormData(event.currentTarget)))) event.currentTarget.reset(); };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border px-3 py-2">{warehouseMode && <><option value="receive">{ar ? "استلام في المستودع" : "Receive into warehouse"}</option><option value="return">{ar ? "إرجاع للمستودع" : "Return to warehouse"}</option></>}<option value="transfer">{ar ? "نقل بين المواقع" : "Location transfer"}</option></select>
    <select name="itemId" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "الصنف" : "Item"}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    {type === "transfer" && <><input type="hidden" name="fromLocationId" value={stationId} /><div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">{ar ? "من: " : "From: "}</span>{source?.name || "—"}</div><select name="toLocationId" required defaultValue="" className="rounded-lg border px-3 py-2"><option value="">{ar ? "اختر محطة الوجهة" : "Choose destination"}</option>{destinations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select></>}
    {type === "receive" && <input type="hidden" name="toLocationId" value={centralWarehouseId} />}
    {type === "return" && <><input type="hidden" name="fromLocationId" value={stationId} /><input type="hidden" name="toLocationId" value={centralWarehouseId || ""} /><div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">{ar ? "إلى: " : "To: "}{warehouse?.name || "—"}</div></>}
    <input name="quantity" type="number" min="1" defaultValue="1" required className="rounded-lg border px-3 py-2" />
    {type === "return" && <input name="qrCode" required placeholder={ar ? "أدخل رمز الصنف" : "Enter item code"} className="rounded-lg border px-3 py-2" />}
    <button disabled={type === "transfer" && !destinations.length} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-40">{ar ? "تنفيذ الحركة" : "Post movement"}</button>
  </form>;
}