import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-body text-muted-foreground">{label}</span>
    {children}
  </label>
);

const input = "w-full rounded-md border border-input px-3 py-2 text-sm font-body";

export default function AssetForm({ asset, stations, employees, lang, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", assetCode: "", category: "", stationId: stations[0]?.id || "", site: "",
    holderId: "", purchaseDate: "", value: "", usefulLifeMonths: "", warrantyEndDate: "",
    inspectionIntervalDays: "", nextInspectionDate: "", status: "available",
    ...(asset || {}),
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e?.target ? e.target.value : e });

  const submit = async () => {
    setSaving(true);
    try {
      const holder = employees.find((e) => e.id === form.holderId);
      await onSave({
        ...form,
        holderName: holder?.name || form.holderName || "",
        value: form.value ? Number(form.value) : null,
        usefulLifeMonths: form.usefulLifeMonths ? Number(form.usefulLifeMonths) : null,
        inspectionIntervalDays: form.inspectionIntervalDays ? Number(form.inspectionIntervalDays) : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-[10px] border border-border bg-card p-4 space-y-3 pb-safe">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">{asset ? (lang === "ar" ? "تعديل أصل" : "Edit asset") : (lang === "ar" ? "أصل جديد" : "New asset")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <Field label={lang === "ar" ? "اسم الأصل" : "Asset name"}><input value={form.name} onChange={set("name")} className={input} /></Field>
        <Field label={lang === "ar" ? "الرقم التسلسلي" : "Serial number"}><input value={form.assetCode} onChange={set("assetCode")} className={input} /></Field>
        <Field label={lang === "ar" ? "الفئة" : "Category"}><input value={form.category} onChange={set("category")} className={input} /></Field>

        <Field label={lang === "ar" ? "الوحدة المالكة" : "Owning unit"}>
          <MobileSelect value={form.stationId} onChange={set("stationId")} searchable className="w-full" options={stations.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label={lang === "ar" ? "المقر" : "Site"}><input value={form.site} onChange={set("site")} className={input} /></Field>
        <Field label={lang === "ar" ? "الحائز (أمين العهد عند الإتاحة)" : "Holder (unit custodian when available)"}>
          <MobileSelect value={form.holderId} onChange={set("holderId")} searchable className="w-full" options={employees.map((e) => ({ value: e.id, label: e.name }))} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={lang === "ar" ? "تاريخ الشراء" : "Purchase date"}><input type="date" value={form.purchaseDate || ""} onChange={set("purchaseDate")} className={input} /></Field>
          <Field label={lang === "ar" ? "القيمة" : "Value"}><input type="number" value={form.value || ""} onChange={set("value")} className={input} /></Field>
          <Field label={lang === "ar" ? "العمر الافتراضي (شهر)" : "Useful life (months)"}><input type="number" value={form.usefulLifeMonths || ""} onChange={set("usefulLifeMonths")} className={input} /></Field>
          <Field label={lang === "ar" ? "نهاية الضمان" : "Warranty end"}><input type="date" value={form.warrantyEndDate || ""} onChange={set("warrantyEndDate")} className={input} /></Field>
          <Field label={lang === "ar" ? "دورية الفحص (يوم)" : "Inspection interval (days)"}><input type="number" value={form.inspectionIntervalDays || ""} onChange={set("inspectionIntervalDays")} className={input} /></Field>
          <Field label={lang === "ar" ? "الفحص القادم" : "Next inspection"}><input type="date" value={form.nextInspectionDate || ""} onChange={set("nextInspectionDate")} className={input} /></Field>
        </div>

        <button disabled={!form.name || !form.assetCode || !form.stationId || saving} onClick={submit} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (lang === "ar" ? "حفظ" : "Save")}
        </button>
      </div>
    </div>
  );
}