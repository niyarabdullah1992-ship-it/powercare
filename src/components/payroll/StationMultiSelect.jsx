import React, { useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function StationMultiSelect({ stations, value, onChange, ar }) {
  const [query, setQuery] = useState("");
  const selected = stations.filter((station) => value.includes(station.id));
  const label = selected.length === 0
    ? (ar ? "جميع المحطات" : "All stations")
    : selected.length === 1
      ? selected[0].name
      : (ar ? `${selected.length} محطات` : `${selected.length} stations`);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  const visibleStations = stations.filter((station) => `${station.name || ""} ${station.location || ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-secondary">
          <MapPin className="h-4 w-4 text-accent" strokeWidth={2} />
          <span className="max-w-36 truncate text-foreground">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-foreground/70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="z-[80] w-64 border-border bg-popover p-2 text-popover-foreground shadow-elevated">
        <DropdownMenuItem onSelect={(event) => { event.preventDefault(); onChange([]); }} className="flex justify-between rounded-lg px-3 py-2 font-medium text-popover-foreground focus:bg-secondary focus:text-secondary-foreground">
          <span>{ar ? "جميع المحطات" : "All stations"}</span>
          {value.length === 0 && <Check className="h-4 w-4 text-accent" />}
        </DropdownMenuItem>
        <label className="relative my-1 block border-y border-border">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.stopPropagation()} placeholder={ar ? "ابحث عن محطة..." : "Search stations..."} className="h-10 w-full border-0 bg-popover pe-3 ps-9 text-sm text-popover-foreground placeholder:text-muted-foreground focus-visible:ring-0" />
        </label>
        <div className="max-h-56 overflow-y-auto">
          {visibleStations.map((station) => (
            <DropdownMenuItem key={station.id} onSelect={(event) => { event.preventDefault(); toggle(station.id); }} className="flex justify-between gap-3 rounded-lg px-3 py-2 text-popover-foreground focus:bg-secondary focus:text-secondary-foreground">
              <span className="min-w-0 truncate font-medium">{station.name}</span>
              {value.includes(station.id) && <Check className="h-4 w-4 shrink-0 text-accent" />}
            </DropdownMenuItem>
          ))}
          {!visibleStations.length && <p className="px-3 py-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد محطة مطابقة" : "No matching station"}</p>}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}