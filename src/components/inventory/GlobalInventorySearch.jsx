import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function GlobalInventorySearch({ items, stations, onOpen, ar }) {
  const [query, setQuery] = useState("");
  const [stationId, setStationId] = useState("all");
  const stationName = (id) => stations.find((station) => (station.stationId || station.id) === id)?.name || "—";
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    return items.flatMap((item) => {
      const searchable = `${item.name} ${item.itemCode}`.toLocaleLowerCase();
      if (!searchable.includes(term)) return [];
      const locations = new Map((item.locationBalances || []).map((balance) => [balance.locationId, Number(balance.quantity) || 0]));
      if (!locations.size && item.currentLocationId) locations.set(item.currentLocationId, Number(item.quantity) || 0);
      return [...locations]
        .filter(([locationId]) => stationId === "all" || locationId === stationId)
        .map(([locationId, quantity]) => ({ item, stationId: locationId, quantity }));
    });
  }, [items, query, stationId]);
  const stationOptions = [
    { value: "all", label: ar ? "جميع المحطات" : "All stations" },
    ...stations.map((station) => ({ value: station.stationId || station.id, label: station.location ? `${station.name} — ${station.location}` : station.name })),
  ];

  return <div className="relative rounded-xl border border-border bg-card p-3">
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex items-center gap-2"><Search className="h-4 w-4 text-accent" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث باسم الصنف أو الكود" : "Search item name or code"} className="w-full border-0 bg-transparent px-1 py-2 text-sm outline-none focus-visible:ring-0" /></div>
      <MobileSelect value={stationId} onChange={setStationId} searchable searchPlaceholder={ar ? "ابحث عن محطة..." : "Search stations..."} placeholder={ar ? "اختر نطاق البحث" : "Choose search scope"} className="w-full rounded-lg" options={stationOptions} />
    </div>
    {query.trim() && <div className="mt-2 max-h-64 space-y-1 overflow-y-auto border-t pt-2">{results.map(({ item, stationId: resultStationId, quantity }) => <button key={`${item.id}-${resultStationId}`} type="button" onClick={() => onOpen(item, resultStationId)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start hover:bg-muted"><span><b className="block text-sm">{item.name}</b><span className="text-xs text-muted-foreground">{item.itemCode} · {stationName(resultStationId)}</span></span><span className="shrink-0 rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{quantity}</span></button>)}{!results.length && <p className="p-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد نتائج في نطاق البحث المحدد." : "No results in the selected search scope."}</p>}</div>}
  </div>;
}