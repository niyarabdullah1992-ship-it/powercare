import React, { useMemo, useState } from "react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function MaterialRequestForm({ items, stations, stationId, onSubmit, ar }) {
  const [sourceStationId, setSourceStationId] = useState("");
  const availableItems = useMemo(() => items.filter((item) => Number(item.locationBalances?.find((balance) => balance.locationId === sourceStationId)?.quantity || 0) > 0), [items, sourceStationId]);
  const submit = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (await onSubmit(Object.fromEntries(form))) { event.currentTarget.reset(); setSourceStationId(""); } };
  const sources = stations.filter((station) => station.stationId !== stationId);
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="md:col-span-2 xl:col-span-4"><h2 className="font-heading text-xl font-semibold">{ar ? "طلب من محطة أخرى" : "Request from another station"}</h2><p className="text-xs text-muted-foreground">{ar ? "تظهر فقط المحطات والأصناف التي يتوفر بها رصيد." : "Only stations and items with available stock are shown."}</p></div>
    <input type="hidden" name="stationId" value={stationId} />
    <MobileSelect name="sourceStationId" value={sourceStationId} onChange={setSourceStationId} searchable searchPlaceholder={ar ? "ابحث باسم المحطة أو الموقع..." : "Search station or location..."} placeholder={ar ? "اختر محطة المصدر" : "Choose source station"} className="w-full rounded-lg" options={sources.map((station) => ({ value: station.stationId, label: station.location ? `${station.name} — ${station.location}` : station.name }))} />
    <select name="itemId" required disabled={!sourceStationId} className="rounded-lg border px-3 py-2"><option value="">{ar ? "اختر الصنف المتوفر" : "Choose available item"}</option>{availableItems.map((item) => <option key={item.id} value={item.id}>{item.name} ({Number(item.locationBalances.find((balance) => balance.locationId === sourceStationId)?.quantity || 0)})</option>)}</select>
    <input name="quantity" type="number" min="1" defaultValue="1" required className="rounded-lg border px-3 py-2" />
    <input name="notes" required placeholder={ar ? "سبب الطلب" : "Request reason"} className="rounded-lg border px-3 py-2" />
    <button disabled={!sources.length || !sourceStationId || !availableItems.length} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-4">{!sources.length ? (ar ? "لا توجد محطة أخرى" : "No other station") : sourceStationId && !availableItems.length ? (ar ? "لا توجد أصناف متوفرة في المحطة" : "No available items at this station") : (ar ? "إرسال الطلب" : "Submit request")}</button>
  </form>;
}