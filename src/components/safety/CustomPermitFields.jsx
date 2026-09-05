import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function CustomPermitFields({ fields = [], onChange, lang, readOnly = false }) {
  const ar = lang === "ar";
  if (readOnly) {
    return fields.length ? <div className="grid gap-1 sm:grid-cols-2">{fields.map((field, index) => <p key={`${field.label}_${index}`} className="rounded-md bg-muted px-2 py-1 text-[10px]"><span className="text-muted-foreground">{field.label}:</span> {field.value}</p>)}</div> : null;
  }
  const update = (index, key, value) => onChange(fields.map((field, i) => i === index ? { ...field, [key]: value } : field));
  return <div className="space-y-2">
    {fields.map((field, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
      <input value={field.label} onChange={(e) => update(index, "label", e.target.value)} placeholder={ar ? "اسم الحقل" : "Field name"} className="rounded-md border border-input px-2 py-1.5 text-xs" />
      <input value={field.value} onChange={(e) => update(index, "value", e.target.value)} placeholder={ar ? "القيمة" : "Value"} className="rounded-md border border-input px-2 py-1.5 text-xs" />
      <button type="button" onClick={() => onChange(fields.filter((_, i) => i !== index))} className="rounded-md p-2 text-destructive hover:bg-muted" aria-label={ar ? "حذف الحقل" : "Remove field"}><Trash2 className="h-3.5 w-3.5" /></button>
    </div>)}
    <button type="button" onClick={() => onChange([...fields, { label: "", value: "" }])} className="flex items-center gap-1 text-[11px] font-medium text-accent"><Plus className="h-3.5 w-3.5" />{ar ? "إضافة حقل" : "Add field"}</button>
  </div>;
}