import React from "react";
import PlanEntitlementsFields from "@/components/owner/PlanEntitlementsFields";

export default function PlanForm({ value, onChange, onSave, onCancel, ar }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return <form onSubmit={onSave} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
    <input required value={value.nameAr} onChange={(e) => set("nameAr", e.target.value)} placeholder="اسم الباقة بالعربية" className="rounded-md border border-input px-3 py-2 text-sm" />
    <input required value={value.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Plan name in English" className="rounded-md border border-input px-3 py-2 text-sm" />
    <input required value={value.slug} disabled={!!value.id} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="plan-id" className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-60" />
    <select value={value.currency} onChange={(e) => set("currency", e.target.value)} className="rounded-md border border-input px-3 py-2 text-sm"><option>USD</option><option>SAR</option></select>
    <input required type="number" min="0" step="0.01" value={value.monthlyPrice} onChange={(e) => set("monthlyPrice", Number(e.target.value))} placeholder={ar ? "السعر الشهري" : "Monthly price"} className="rounded-md border border-input px-3 py-2 text-sm" />
    <input required type="number" min="0" step="0.01" value={value.yearlyPrice} onChange={(e) => set("yearlyPrice", Number(e.target.value))} placeholder={ar ? "السعر السنوي" : "Yearly price"} className="rounded-md border border-input px-3 py-2 text-sm" />
    <textarea value={(value.featuresAr || []).join("\n")} onChange={(e) => set("featuresAr", e.target.value.split("\n").filter(Boolean))} placeholder="المزايا العربية — ميزة في كل سطر" className="min-h-28 rounded-md border border-input px-3 py-2 text-sm" />
    <textarea value={(value.featuresEn || []).join("\n")} onChange={(e) => set("featuresEn", e.target.value.split("\n").filter(Boolean))} placeholder="English features — one per line" className="min-h-28 rounded-md border border-input px-3 py-2 text-sm" />
    <PlanEntitlementsFields value={value} onChange={onChange} ar={ar} />
    <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={value.freeNow === true} onChange={(e) => set("freeNow", e.target.checked)} />{ar ? "إتاحة الباقة مجانًا حاليًا" : "Offer this plan free for now"}</label>
    <div className="flex gap-2 md:col-span-2"><button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{ar ? "حفظ الباقة" : "Save plan"}</button><button type="button" onClick={onCancel} className="rounded-md border border-border px-5 py-2 text-sm">{ar ? "إلغاء" : "Cancel"}</button></div>
  </form>;
}