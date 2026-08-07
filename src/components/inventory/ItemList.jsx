import React from "react";
import { QrCode, AlertTriangle } from "lucide-react";

export default function ItemList({ items, stations, onSelect, ar }) {
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  if (!items.length) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{ar ? "لا توجد أصناف بعد." : "No items yet."}</p>;
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => {
    const low = Number(item.quantity) <= Number(item.minimumStock);
    return <button key={item.displayKey || item.id} onClick={() => onSelect(item)} className="rounded-xl border border-border bg-card p-4 text-start hover:border-accent/50">
      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.itemCode} · {stationName(item.currentLocationId)}</p></div><QrCode className="h-5 w-5 text-accent" /></div>
      <p className="mt-3 text-xs text-muted-foreground">{ar ? "المصدر: " : "Source: "}<span className="font-medium text-foreground">{item.sourceType === "transfer" ? `${ar ? "تحويل من" : "Transfer from"} ${stationName(item.sourceLocationId)}` : (ar ? "المشتريات" : "Purchase")}</span></p>
      <div className="mt-3 flex items-center justify-between"><span className="text-2xl font-semibold">{item.quantity}</span>{low && <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-[10px] text-destructive"><AlertTriangle className="h-3 w-3" />{ar ? "منخفض" : "Low"}</span>}</div>
    </button>;
  })}</div>;
}