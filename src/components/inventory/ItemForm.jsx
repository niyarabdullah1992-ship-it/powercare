import React, { useState } from "react";

export default function ItemForm({ items, stations, defaultStationId, centralWarehouseId, onSubmit, onTransfer, ar }) {
  const [sourceType, setSourceType] = useState("purchase");
  const [sourceStation, setSourceStation] = useState("");
  const [itemId, setItemId] = useState("");
  const availableItems = items.filter((item) => Number(item.locationBalances?.find((balance) => balance.locationId === sourceStation)?.quantity || 0) > 0);
  const submit = async (event) => {
    event.preventDefault(); const formElement = event.currentTarget; const values = Object.fromEntries(new FormData(formElement));
    const ok = sourceType === "purchase" ? await onSubmit(values) : await onTransfer({ ...values, itemId, fromLocationId: sourceStation, toLocationId: defaultStationId });
    if (ok) { formElement.reset(); setSourceType("purchase"); setSourceStation(""); setItemId(""); }
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <select value={sourceType} onChange={(event) => { setSourceType(event.target.value); setSourceStation(""); setItemId(""); }} className="rounded-lg border px-3 py-2"><option value="purchase">{ar ? "المصدر: مشتريات" : "Source: Purchase"}</option><option value="transfer">{ar ? "المصدر: تحويل بين الفروع أو المحطات" : "Source: Branch or station transfer"}</option></select>
    {sourceType === "purchase" ? <>
      <input name="name" required placeholder={ar ? "اسم الصنف" : "Item name"} className="rounded-lg border px-3 py-2" />
      <input name="itemCode" required placeholder={ar ? "كود الصنف" : "Item code"} className="rounded-lg border px-3 py-2" />
      <input type="hidden" name="locationId" value={centralWarehouseId} />
      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">{ar ? "الموقع الابتدائي: " : "Initial location: "}</span>{ar ? "المستودع المركزي" : "Central Warehouse"}</div>
      <input name="quantity" type="number" min="0" defaultValue="0" placeholder={ar ? "الكمية" : "Quantity"} className="rounded-lg border px-3 py-2" />
    </> : <>
      <select required value={sourceStation} onChange={(event) => { setSourceStation(event.target.value); setItemId(""); }} className="rounded-lg border px-3 py-2"><option value="">{ar ? "محطة المصدر" : "Source station"}</option>{stations.filter((station) => station.stationId !== defaultStationId).map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select>
      <select required value={itemId} onChange={(event) => setItemId(event.target.value)} className="rounded-lg border px-3 py-2"><option value="">{ar ? "اختر الصنف" : "Choose item"}</option>{availableItems.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.itemCode}</option>)}</select>
      <input name="quantity" type="number" min="1" defaultValue="1" required className="rounded-lg border px-3 py-2" placeholder={ar ? "الكمية" : "Quantity"} />
      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">{ar ? "إلى: " : "To: "}{stations.find((station) => station.stationId === defaultStationId)?.name || "—"}</div>
    </>}
    <button disabled={sourceType === "transfer" && (!sourceStation || !itemId)} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-40">{sourceType === "purchase" ? (ar ? "إضافة الصنف" : "Add item") : (ar ? "تنفيذ التحويل" : "Transfer stock")}</button>
  </form>;
}