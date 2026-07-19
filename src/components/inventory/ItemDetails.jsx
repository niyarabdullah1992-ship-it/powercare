import React from "react";
import { X } from "lucide-react";

export default function ItemDetails({ item, stations, onClose, ar }) {
  if (!item) return null;
  const qr = `https://quickchart.io/qr?size=220&text=${encodeURIComponent(item.qrCode)}`;
  const station = (id) => stations.find((entry) => entry.stationId === id)?.name || "—";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}><div onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-5">
    <div className="flex justify-between"><div><h2 className="font-heading text-2xl font-semibold">{item.name}</h2><p className="text-sm text-muted-foreground">{item.itemCode}</p></div><button onClick={onClose}><X /></button></div>
    <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]"><img src={qr} alt="Item QR code" className="rounded-xl border bg-card" /><div className="space-y-2 text-sm"><p>{ar ? "الكمية:" : "Quantity:"} <b>{item.quantity}</b></p><p>{ar ? "الحد الأدنى:" : "Minimum:"} <b>{item.minimumStock}</b></p><p>{ar ? "الموقع:" : "Location:"} <b>{station(item.currentLocationId)}</b></p><p>{ar ? "المصدر:" : "Source:"} <b>{item.sourceType === "transfer" ? `${ar ? "تحويل من" : "Transfer from"} ${station(item.sourceLocationId)}` : (ar ? "المشتريات" : "Purchase")}</b></p><p className="break-all text-xs text-muted-foreground">{item.qrCode}</p></div></div>
  </div></div>;
}