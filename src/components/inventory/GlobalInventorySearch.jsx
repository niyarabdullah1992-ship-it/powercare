import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

export default function GlobalInventorySearch({ items, units, stations, onOpen, ar }) {
  const [query, setQuery] = useState("");
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    return items.filter((item) => `${item.name} ${item.itemCode}`.toLocaleLowerCase().includes(term)).flatMap((item) => {
      const locations = item.trackingMode === "serialized"
        ? units.filter((unit) => unit.itemId === item.id && unit.status === "available").reduce((map, unit) => map.set(unit.locationId, (map.get(unit.locationId) || 0) + 1), new Map())
        : new Map((item.locationBalances || []).filter((balance) => Number(balance.quantity) > 0).map((balance) => [balance.locationId, Number(balance.quantity)]));
      if (!locations.size) locations.set(item.currentLocationId, 0);
      return [...locations].map(([stationId, quantity]) => ({ item, stationId, quantity }));
    });
  }, [items, units, query]);

  return <div className="relative rounded-xl border border-border bg-card p-3">
    <div className="flex items-center gap-2"><Search className="h-4 w-4 text-accent" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث بالاسم أو كود الصنف في جميع المحطات" : "Search name or code across all stations"} className="w-full border-0 bg-transparent px-1 py-2 text-sm outline-none focus-visible:ring-0" /></div>
    {query.trim() && <div className="mt-2 max-h-64 space-y-1 overflow-y-auto border-t pt-2">{results.map(({ item, stationId, quantity }) => <button key={`${item.id}-${stationId}`} type="button" onClick={() => onOpen(item, stationId)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start hover:bg-muted"><span><b className="block text-sm">{item.name}</b><span className="text-xs text-muted-foreground">{item.itemCode} · {stationName(stationId)}</span></span><span className="shrink-0 rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{quantity}</span></button>)}{!results.length && <p className="p-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد نتائج." : "No results."}</p>}</div>}
  </div>;
}