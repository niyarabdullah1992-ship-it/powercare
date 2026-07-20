import React from "react";

export default function TransferHistory({ movements, items, stations, ar }) {
  const transfers = movements.filter((entry) => entry.movementType === "transfer");
  const itemName = (id) => items.find((item) => item.id === id)?.name || "—";
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  return <section className="rounded-xl border border-border bg-card p-4"><h2 className="mb-3 font-heading text-xl font-semibold">{ar ? "سجل التحويلات بين المحطات" : "Inter-station transfer history"}</h2><div className="space-y-2">{transfers.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="font-medium">{itemName(entry.itemId)} · {entry.quantity}</span><span className="text-muted-foreground">{stationName(entry.fromLocationId)} → {stationName(entry.toLocationId)} · {new Date(entry.created_date).toLocaleString(ar ? "ar-SA" : "en-GB")}</span></div>)}{!transfers.length && <p className="py-5 text-center text-sm text-muted-foreground">{ar ? "لا توجد تحويلات." : "No transfers."}</p>}</div></section>;
}