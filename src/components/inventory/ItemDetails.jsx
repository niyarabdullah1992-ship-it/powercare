import React from "react";
import { X } from "lucide-react";

export default function ItemDetails({ item, units, stations, onClose, ar }) {
  if (!item) return null;
  const qr = `https://quickchart.io/qr?size=220&text=${encodeURIComponent(item.qrCode)}`;
  const itemUnits = units.filter((unit) => unit.itemId === item.id);
  const station = (id) => stations.find((entry) => entry.stationId === id)?.name || "—";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}><div onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-5">
    <div className="flex justify-between"><div><h2 className="font-heading text-2xl font-semibold">{item.name}</h2><p className="text-sm text-muted-foreground">{item.itemCode}</p></div><button onClick={onClose}><X /></button></div>
    <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]"><img src={qr} alt="Item QR code" className="rounded-xl border bg-card" /><div className="space-y-2 text-sm"><p>{ar ? "الكمية:" : "Quantity:"} <b>{item.quantity}</b></p><p>{ar ? "الحد الأدنى:" : "Minimum:"} <b>{item.minimumStock}</b></p><p>{ar ? "الموقع:" : "Location:"} <b>{station(item.currentLocationId)}</b></p><p className="break-all text-xs text-muted-foreground">{item.qrCode}</p></div></div>
    {item.trackingMode === "serialized" && <div className="mt-5 space-y-2"><h3 className="font-semibold">{ar ? "القطع المتسلسلة ورموزها الفريدة" : "Serialized units and unique codes"}</h3>{itemUnits.map((unit) => <div key={unit.id} className="flex items-center gap-3 rounded-lg border p-3 text-xs"><img src={`https://quickchart.io/qr?size=72&text=${encodeURIComponent(unit.qrCode)}`} alt={`QR ${unit.serialNumber}`} className="h-16 w-16 rounded border" /><div className="min-w-0"><p className="font-semibold">{unit.serialNumber}</p><p>{station(unit.locationId)} · {unit.status}</p><p className="truncate text-muted-foreground">{unit.qrCode}</p></div></div>)}</div>}
  </div></div>;
}