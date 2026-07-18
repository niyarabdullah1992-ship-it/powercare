import React, { useState } from "react";

export default function MovementForm({ items, stations, onSubmit, ar }) {
  const [type, setType] = useState("receive");
  const submit = async (event) => { event.preventDefault(); if (await onSubmit(type, Object.fromEntries(new FormData(event.currentTarget)))) event.currentTarget.reset(); };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border px-3 py-2"><option value="receive">{ar ? "استلام" : "Receive"}</option><option value="return">{ar ? "إرجاع" : "Return"}</option><option value="transfer">{ar ? "تحويل" : "Transfer"}</option></select>
    <select name="itemId" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "الصنف" : "Item"}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    {type === "transfer" && <select name="fromLocationId" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "من محطة" : "From station"}</option>{stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select>}
    <select name="toLocationId" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "إلى محطة" : "To station"}</option>{stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select>
    <input name="quantity" type="number" min="1" defaultValue="1" className="rounded-lg border px-3 py-2" />
    <input name="serialNumber" placeholder={ar ? "الرقم التسلسلي عند الاستلام" : "Serial on receipt"} className="rounded-lg border px-3 py-2" />
    {type !== "receive" && <input name="qrCode" placeholder={ar ? "امسح أو أدخل رمز QR" : "Scan or enter QR"} className="rounded-lg border px-3 py-2" />}
    <button className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">{ar ? "تنفيذ الحركة" : "Post movement"}</button>
  </form>;
}