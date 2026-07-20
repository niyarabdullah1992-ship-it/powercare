import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import InventoryStationMultiSelect from "@/components/inventory/InventoryStationMultiSelect";

export default function GlobalInventorySearch({ items, stations, stationIds, onStationIdsChange, onOpen, ar }) {
  const [query, setQuery] = useState("");
  const stationName = (id) => stations.find((station) => (station.stationId || station.id) === id)?.name || "—";
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term && !stationIds.length) return [];
    return items.flatMap((item) => {
      if (term && !`${item.name} ${item.itemCode}`.toLocaleLowerCase().includes(term)) return [];
      const locations = new Map((item.locationBalances || []).map((balance) => [balance.locationId, Number(balance.quantity) || 0]));
      if (!locations.size && item.currentLocationId) locations.set(item.currentLocationId, Number(item.quantity) || 0);
      return [...locations]
        .filter(([locationId]) => !stationIds.length || stationIds.includes(locationId))
        .map(([locationId, quantity]) => ({ item, stationId: locationId, quantity }));
    });
  }, [items, query, stationIds]);

  return <div className="relative rounded-xl border border-border bg-card p-3">
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex items-center gap-2"><Search className="h-4 w-4 text-accent" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث باسم الصنف أو الكود" : "Search item name or code"} className="w-full border-0 bg-transparent px-1 py-2 text-sm outline-none focus-visible:ring-0" /></div>
      <InventoryStationMultiSelect stations={stations} value={stationIds} onChange={onStationIdsChange} ar={ar} />
    </div>
    {(query.trim() || stationIds.length > 0) && <div className="mt-2 max-h-80 space-y-1 overflow-y-auto border-t pt-2">{results.map(({ item, stationId, quantity }) => <button key={`${item.id}-${stationId}`} type="button" onClick={() => onOpen(item, stationId)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start hover:bg-muted"><span><b className="block text-sm">{item.name}</b><span className="text-xs text-muted-foreground">{item.itemCode} · {stationName(stationId)}</span></span><span className="shrink-0 rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{quantity}</span></button>)}{!results.length && <p className="p-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد أصناف في نطاق البحث المحدد." : "No items in the selected search scope."}</p>}</div>}
  </div>;
}