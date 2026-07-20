import React, { useEffect, useRef, useState } from "react";
import MultiImageUploader from "@/components/inventory/MultiImageUploader";
import InvoiceUploader from "@/components/inventory/InvoiceUploader";
import MobileSelect from "@/components/mobile/MobileSelect";

const today = () => new Date().toISOString().slice(0, 10);

export default function ItemForm({ stations, defaultStationId, onSubmit, ar }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [invoice, setInvoice] = useState({ url: "", name: "" });
  const [locationId, setLocationId] = useState(defaultStationId || "");
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  useEffect(() => { setLocationId(defaultStationId || ""); }, [defaultStationId]);
  const submit = async (event) => {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    const form = event.currentTarget;
    const saved = await onSubmit({ ...Object.fromEntries(new FormData(form)), imageUrls, invoiceUrl: invoice.url, invoiceName: invoice.name });
    if (saved) { form.reset(); setImageUrls([]); setInvoice({ url: "", name: "" }); setLocationId(defaultStationId || ""); }
    submitLock.current = false;
    setSubmitting(false);
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="md:col-span-2 xl:col-span-4"><h2 className="font-heading text-xl font-semibold">{ar ? "إنشاء صنف وتسجيل الشراء" : "Create item and record purchase"}</h2><p className="text-xs text-muted-foreground">{ar ? "أدخل بيانات الصنف والكود والكمية والتكلفة والمورد والصورة لإضافته إلى مخزن المحطة." : "Enter item, code, quantity, cost, supplier and image details to add it to the station store."}</p></div>
    <input name="name" required placeholder={ar ? "اسم الصنف" : "Item name"} className="rounded-lg border px-3 py-2" />
    <input name="itemCode" required placeholder={ar ? "كود الصنف" : "Item code"} className="rounded-lg border px-3 py-2" />
    <MobileSelect name="locationId" value={locationId} onChange={setLocationId} searchable searchPlaceholder={ar ? "ابحث باسم المحطة أو الموقع..." : "Search station or location..."} placeholder={ar ? "اختر المحطة" : "Choose station"} className="w-full rounded-lg" options={stations.map((station) => ({ value: station.stationId, label: station.location ? `${station.name} — ${station.location}` : station.name }))} />
    <input name="quantity" type="number" min="1" step="1" required placeholder={ar ? "الكمية" : "Quantity"} className="rounded-lg border px-3 py-2" />
    <input name="minimumStock" type="number" min="0" step="1" defaultValue="0" placeholder={ar ? "الحد الأدنى للمخزون" : "Minimum stock"} className="rounded-lg border px-3 py-2" />
    <input name="unitPrice" type="number" min="0" step="0.01" placeholder={ar ? "سعر الوحدة (اختياري)" : "Unit price (optional)"} className="rounded-lg border px-3 py-2" />
    <input name="totalCost" type="number" min="0" step="0.01" required placeholder={ar ? "التكلفة الإجمالية" : "Total cost"} className="rounded-lg border px-3 py-2" />
    <input name="supplierName" required placeholder={ar ? "اسم المورد" : "Supplier name"} className="rounded-lg border px-3 py-2" />
    <input name="purchaseDate" type="date" defaultValue={today()} required className="rounded-lg border px-3 py-2" />
    <MultiImageUploader value={imageUrls} onChange={setImageUrls} ar={ar} />
    <InvoiceUploader value={invoice.url} fileName={invoice.name} onChange={(url, name) => setInvoice({ url, name })} ar={ar} />
    <button disabled={!locationId || submitting} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-40">{submitting ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ الشراء" : "Save purchase")}</button>
  </form>;
}