import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, Warehouse } from "lucide-react";
import { useOrgTerms } from "@/hooks/useOrgTerms";

export default function StationWarehousePicker({ stations = [], value, onChange, locked, allowAll = false, ar }) {
  const { terms } = useOrgTerms();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const stationId = (station) => station.stationId || station.id;
  const selected = stations.find((station) => stationId(station) === value);
  const stationLabel = (station) => !station ? "—" : station.location ? `${station.name} — ${station.location}` : station.name;
  const visible = stations.filter((station) => stationLabel(station).toLowerCase().includes(query.trim().toLowerCase()));
  const allLabel = terms.allStations;
  const showAll = allowAll && allLabel.toLowerCase().includes(query.trim().toLowerCase());

  useEffect(() => {
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><Warehouse className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1" ref={rootRef}>
      <p className="text-xs text-muted-foreground">{ar ? "موقع المخزون" : "Inventory location"}</p>
      {!stations.length ? <p className="mt-1 text-sm font-medium text-muted-foreground">{ar ? `لا توجد ${terms.stations} متاحة. أضف ${terms.aStation} أولاً.` : `No ${terms.stations.toLowerCase()} available. Add ${terms.aStation} first.`}</p> : locked ? <p className="mt-1 truncate font-medium">{stationLabel(selected)}</p> : <div className="relative mt-1">
        <button type="button" aria-expanded={open} onClick={() => { setOpen(!open); setQuery(""); }} className="flex w-full items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium"><span className="truncate">{value === "all" ? allLabel : selected ? stationLabel(selected) : terms.selectStation}</span><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /></button>
        {open && <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated">
          <div className="relative border-b border-border"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? `ابحث باسم ${terms.theStation} أو الموقع...` : `Search ${terms.station.toLowerCase()} or location...`} className="h-11 w-full border-0 bg-popover pe-3 ps-10 text-sm outline-none focus-visible:ring-0" /></div>
          <div className="max-h-60 overflow-y-auto">{showAll && <button type="button" onClick={() => { onChange("all"); setOpen(false); setQuery(""); }} className="flex w-full items-center gap-3 px-3 py-3 text-start text-sm font-medium hover:bg-secondary"><span className="min-w-0 flex-1 truncate">{allLabel}</span>{value === "all" && <Check className="h-4 w-4 shrink-0 text-accent" />}</button>}{visible.map((station) => <button type="button" key={stationId(station)} onClick={() => { onChange(stationId(station)); setOpen(false); setQuery(""); }} className="flex w-full items-center gap-3 px-3 py-3 text-start text-sm hover:bg-secondary"><span className="min-w-0 flex-1 truncate">{stationLabel(station)}</span>{stationId(station) === value && <Check className="h-4 w-4 shrink-0 text-accent" />}</button>)}{!showAll && !visible.length && <p className="px-3 py-5 text-center text-sm text-muted-foreground">{ar ? `لا توجد ${terms.aStation} مطابقة` : `No matching ${terms.station.toLowerCase()}`}</p>}</div>
        </div>}
      </div>}
    </div>
  </div>;
}
