import React from "react";

export default function MovementForm({ items, stations, stationId, onSubmit, ar }) {
  const source = stations.find((station) => station.stationId === stationId);
  const destinations = stations.filter((station) => station.stationId !== stationId);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (await onSubmit("transfer", Object.fromEntries(new FormData(form)))) form.reset();
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <input type="hidden" name="fromLocationId" value={stationId} />
    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">{ar ? "من: " : "From: "}</span>{source?.name || "—"}</div>
    <select name="itemId" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "الصنف" : "Item"}</option>{items.filter((item) => Number(item.quantity) > 0).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity}</option>)}</select>
    <select name="toLocationId" required defaultValue="" className="rounded-lg border px-3 py-2"><option value="">{ar ? "محطة الوجهة" : "Destination station"}</option>{destinations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select>
    <input name="quantity" type="number" min="1" defaultValue="1" required className="rounded-lg border px-3 py-2" />
    <button disabled={!stationId || !destinations.length} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-40">{ar ? "تنفيذ النقل" : "Transfer stock"}</button>
  </form>;
}