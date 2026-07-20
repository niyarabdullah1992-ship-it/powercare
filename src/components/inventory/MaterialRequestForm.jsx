import React, { useMemo, useState } from "react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function MaterialRequestForm({ items, purchases = [], stations, stationId, onSubmit, ar }) {
  const [sourceStationId, setSourceStationId] = useState("");
  const [destinationStationId, setDestinationStationId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const ownerMode = !stationId;
  const availableItems = useMemo(() => items.filter((item) => Number(item.locationBalances?.find((balance) => balance.locationId === sourceStationId)?.quantity || 0) > 0), [items, sourceStationId]);
  const availableQuantity = Number(availableItems.find((item) => item.id === itemId)?.locationBalances?.find((balance) => balance.locationId === sourceStationId)?.quantity || 0);
  const latestPurchase = purchases.find((purchase) => purchase.itemId === itemId && purchase.toLocationId === sourceStationId);
  const unitPrice = Number(latestPurchase?.unitPrice ?? latestPurchase?.purchasePrice ?? 0);
  const totalCost = Number(quantity || 0) * unitPrice;
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    const saved = await onSubmit(Object.fromEntries(form));
    if (saved) { formElement.reset(); setSourceStationId(""); setDestinationStationId(""); setItemId(""); setQuantity("1"); }
    setSubmitting(false);
  };
  const sources = stations.filter((station) => ownerMode || station.stationId !== stationId);
  const destinations = stations.filter((station) => station.stationId !== sourceStationId);
  const chooseSource = (value) => { setSourceStationId(value); setItemId(""); setQuantity("1"); if (destinationStationId === value) setDestinationStationId(""); };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="md:col-span-2 xl:col-span-4"><h2 className="font-heading text-xl font-semibold">{ar ? "طلب من محطة أخرى" : "Request from another station"}</h2><p className="text-xs text-muted-foreground">{ar ? "اختر المصدر والوجهة والصنف، ثم حدد الكمية لاحتساب قيمة النقل تلقائياً." : "Choose source, destination and item, then enter quantity to calculate the transfer value."}</p></div>
    {!ownerMode && <input type="hidden" name="stationId" value={stationId} />}
    <MobileSelect name="sourceStationId" value={sourceStationId} onChange={chooseSource} searchable searchPlaceholder={ar ? "ابحث باسم المحطة أو الموقع..." : "Search station or location..."} placeholder={ar ? "اختر محطة المصدر" : "Choose source station"} className="w-full rounded-lg" options={sources.map((station) => ({ value: station.stationId, label: station.location ? `${station.name} — ${station.location}` : station.name }))} />
    {ownerMode && <MobileSelect name="stationId" value={destinationStationId} onChange={setDestinationStationId} searchable searchPlaceholder={ar ? "ابحث باسم المحطة أو الموقع..." : "Search station or location..."} placeholder={ar ? "اختر محطة الوجهة" : "Choose destination station"} className="w-full rounded-lg" options={destinations.map((station) => ({ value: station.stationId, label: station.location ? `${station.name} — ${station.location}` : station.name }))} />}
    <MobileSelect name="itemId" value={itemId} onChange={(value) => { setItemId(value); setQuantity("1"); }} disabled={!sourceStationId} searchable searchPlaceholder={ar ? "ابحث باسم الصنف أو الكود..." : "Search item name or code..."} placeholder={ar ? "اختر الصنف المتوفر" : "Choose available item"} className="w-full rounded-lg" options={availableItems.map((item) => ({ value: item.id, label: `${item.name} — ${ar ? "المتوفر" : "Available"}: ${Number(item.locationBalances.find((balance) => balance.locationId === sourceStationId)?.quantity || 0)}` }))} />
    <label className="space-y-1 text-xs text-muted-foreground"><span>{ar ? `الكمية المطلوبة${itemId ? ` — المتوفر: ${availableQuantity}` : ""}` : `Requested quantity${itemId ? ` — available: ${availableQuantity}` : ""}`}</span><input name="quantity" type="number" min="1" max={availableQuantity || undefined} value={quantity} onChange={(event) => setQuantity(event.target.value)} required className="w-full rounded-lg border px-3 py-2 text-foreground" /></label>
    <label className="space-y-1 text-xs text-muted-foreground"><span>{ar ? "سعر الوحدة (ر.س)" : "Unit price (SAR)"}</span><input name="unitPrice" readOnly value={unitPrice.toFixed(2)} className="w-full rounded-lg border bg-muted px-3 py-2 font-semibold text-foreground" /></label>
    <label className="space-y-1 text-xs text-muted-foreground"><span>{ar ? "قيمة الكمية المنقولة (ر.س)" : "Transfer value (SAR)"}</span><input name="totalCost" readOnly value={totalCost.toFixed(2)} className="w-full rounded-lg border bg-muted px-3 py-2 font-semibold text-foreground" /></label>
    <input name="notes" required placeholder={ar ? "سبب الطلب" : "Request reason"} className="rounded-lg border px-3 py-2" />
    <button disabled={submitting || !sources.length || !sourceStationId || !itemId || (ownerMode && !destinationStationId) || !availableItems.length} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-4">{submitting ? (ar ? "جارٍ الإرسال..." : "Submitting...") : !sources.length ? (ar ? "لا توجد محطة أخرى" : "No other station") : sourceStationId && !availableItems.length ? (ar ? "لا توجد أصناف متوفرة في المحطة" : "No available items at this station") : (ar ? "إرسال الطلب" : "Submit request")}</button>
  </form>;
}