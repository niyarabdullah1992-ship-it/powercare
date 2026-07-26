import React, { useState } from "react";
import { Building2, ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";

export default function StationCameraOverview({ stations, cameras, statuses, ar, onSelect }) {
  const [open, setOpen] = useState(true);
  return <section className="camera-station-panel">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-start" aria-expanded={open}>
      <div><p className="camera-panel-kicker">{ar ? "إدارة الأجهزة الموحدة" : "Unified device management"}</p><h2 className="font-heading text-lg font-semibold">{ar ? "منظومة المحطات والأجهزة" : "Station & Device Ecosystem"}</h2></div>
      <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">{open ? (ar ? "طي" : "Collapse") : (ar ? "عرض" : "Show")}{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
    </button>
    {open && <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{stations.map((station) => { const items = cameras.filter((item) => item.stationId === station.id); const offline = items.filter((item) => statuses[item.id] === "offline").length; return <button key={station.id} onClick={() => onSelect(station.id)} className="camera-station-tile"><span className="rounded-full bg-primary p-2 text-accent"><Building2 className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{station.name}</span><span className="text-xs text-muted-foreground">{items.length} {ar ? "كاميرا" : "cameras"}{offline ? ` · ${offline} ${ar ? "منقطعة" : "offline"}` : ""}</span></span><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>; })}</div>}
  </section>;
}