import React, { useState } from "react";
import { Check, X } from "lucide-react";
import ProofCrewEditor from "@/components/proof/ProofCrewEditor";

// تعديل بطاقة محفوظة — متاح خلال 24 ساعة من حفظها فقط.
export const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const canEditCard = (card) => Date.now() - new Date(card.signedAt || 0).getTime() < EDIT_WINDOW_MS;

export default function ProofCardInlineEdit({ card, employees = [], ar, onSave, onCancel }) {
  const [form, setForm] = useState(card);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const fields = [
    { key: "companyName", ar: "اسم الشركة", en: "Company name" },
    { key: "projectName", ar: "اسم المشروع", en: "Project name" },
    { key: "contractNumber", ar: "رقم العقد", en: "Contract number", ltr: true },
    { key: "purpose", ar: "الغرض من الدخول", en: "Purpose of entry" },
    { key: "notes", ar: "ملاحظات", en: "Notes" },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-accent/40 bg-secondary/40 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="text-[11px] text-muted-foreground font-body">
            {ar ? field.ar : field.en}
            <input
              value={form[field.key] || ""}
              onChange={set(field.key)}
              dir={field.ltr ? "ltr" : undefined}
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground"
            />
          </label>
        ))}
      </div>

      <label className="block text-[11px] text-muted-foreground font-body">
        {ar ? "المواد المصروفة" : "Materials issued"}
        <textarea value={form.materials || ""} onChange={set("materials")} rows={2} className="mt-1 w-full resize-y rounded-md border border-input px-3 py-2 text-sm text-foreground" />
      </label>

      <ProofCrewEditor
        value={form.crew || []}
        onChange={(crew) => setForm((current) => ({ ...current, crew }))}
        employees={employees}
        ar={ar}
      />

      <div className="flex gap-2">
        <button type="button" onClick={() => onSave({ ...form, editedAt: new Date().toISOString() })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-body text-primary-foreground hover:bg-accent">
          <Check className="h-3.5 w-3.5" /> {ar ? "حفظ التعديل" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
          <X className="h-3.5 w-3.5" /> {ar ? "إلغاء" : "Cancel"}
        </button>
      </div>
    </div>
  );
}