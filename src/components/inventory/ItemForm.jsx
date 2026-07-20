import React, { useState } from "react";
import MultiImageUploader from "@/components/inventory/MultiImageUploader";

const today = () => new Date().toISOString().slice(0, 10);

export default function ItemForm({ stations, defaultStationId, onSubmit, ar }) {
  const [imageUrls, setImageUrls] = useState([]);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (await onSubmit({ ...Object.fromEntries(new FormData(form)), imageUrls })) { form.reset(); setImageUrls([]); }
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="md:col-span-2 xl:col-span-4"><h2 className="font-heading text-xl font-semibold">{ar ? "إنشاء صنف وتسجيل الشراء" : "Create item and record purchase"}</h2><p className="text-xs text-muted-foreground">{ar ? "أدخل بيانات الصنف والكود والكمية والتكلفة والمورد والصورة لإضافته إلى مخزن المحطة." : "Enter item, code, quantity, cost, supplier and image details to add it to the station store."}</p></div>
    <input name="name" required placeholder={ar ? "اسم الصنف" : "Item name"} className="rounded-lg border px-3 py-2" />
    <input name="itemCode" required placeholder={ar ? "كود الصنف" : "Item code"} className="rounded-lg border px-3 py-2" />
    <select name="locationId" required defaultValue={defaultStationId} className="rounded-lg border px-3 py-2"><option value="">{ar ? "اختر المحطة" : "Choose station"}</option>{stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}</select>
    <input name="quantity" type="number" min="1" step="1" required placeholder={ar ? "الكمية" : "Quantity"} className="rounded-lg border px-3 py-2" />
    <input name="minimumStock" type="number" min="0" step="1" defaultValue="0" placeholder={ar ? "الحد الأدنى للمخزون" : "Minimum stock"} className="rounded-lg border px-3 py-2" />
    <input name="unitPrice" type="number" min="0" step="0.01" placeholder={ar ? "سعر الوحدة (اختياري)" : "Unit price (optional)"} className="rounded-lg border px-3 py-2" />
    <input name="totalCost" type="number" min="0" step="0.01" required placeholder={ar ? "التكلفة الإجمالية" : "Total cost"} className="rounded-lg border px-3 py-2" />
    <input name="supplierName" required placeholder={ar ? "اسم المورد" : "Supplier name"} className="rounded-lg border px-3 py-2" />
    <input name="purchaseDate" type="date" defaultValue={today()} required className="rounded-lg border px-3 py-2" />
    <MultiImageUploader value={imageUrls} onChange={setImageUrls} ar={ar} />
    <button className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">{ar ? "حفظ الشراء" : "Save purchase"}</button>
  </form>;
}