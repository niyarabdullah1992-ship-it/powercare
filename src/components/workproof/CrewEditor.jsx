import React from "react";
import { Plus, Trash2 } from "lucide-react";

export const ID_TYPES = [
  { value: "national_id", ar: "هوية وطنية", en: "National ID" },
  { value: "iqama", ar: "إقامة", en: "Iqama" },
  { value: "passport", ar: "جواز سفر", en: "Passport" },
  { value: "other", ar: "أخرى", en: "Other" },
];

export function idTypeLabel(value, ar) {
  const item = ID_TYPES.find((type) => type.value === value);
  return item ? (ar ? item.ar : item.en) : value || "—";
}

// Crew members performing the work — name + identity document (ID / Iqama / passport).
export default function CrewEditor({ workers, onChange, ar }) {
  const update = (index, key, value) => onChange(workers.map((worker, i) => (i === index ? { ...worker, [key]: value } : worker)));
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground font-body">{ar ? "بيانات العمال المنفذين" : "Crew members"}</p>
      {workers.map((worker, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1.2fr_1fr_auto]">
          <input value={worker.name || ""} onChange={(e) => update(index, "name", e.target.value)} placeholder={ar ? "اسم العامل" : "Worker name"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <select value={worker.idType || "iqama"} onChange={(e) => update(index, "idType", e.target.value)} className="rounded-md border px-3 py-2 text-sm font-body">
            {ID_TYPES.map((type) => <option key={type.value} value={type.value}>{ar ? type.ar : type.en}</option>)}
          </select>
          <input value={worker.idNumber || ""} onChange={(e) => update(index, "idNumber", e.target.value)} placeholder={ar ? "رقم البطاقة" : "Document number"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <input value={worker.phone || ""} onChange={(e) => update(index, "phone", e.target.value)} placeholder={ar ? "الجوال (اختياري)" : "Phone (optional)"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <button type="button" onClick={() => onChange(workers.filter((_, i) => i !== index))} className="rounded-md border border-border p-2 text-destructive hover:bg-muted" aria-label="remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...workers, { name: "", idType: "iqama", idNumber: "", phone: "" }])} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
        <Plus className="h-3.5 w-3.5" />{ar ? "إضافة عامل" : "Add worker"}
      </button>
    </div>
  );
}