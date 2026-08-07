import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { LADDERS } from "@/lib/jobCatalogApi";

export default function JobTitleForm({ initial, onSave, onClose, lang }) {
  const ar = lang === "ar";
  const [fields, setFields] = useState({
    id: initial?.id, name: initial?.name || "", ladder: initial?.ladder || "general",
    grade: initial?.grade || "", duties: initial?.duties || "", effortWeight: initial?.effortWeight ?? 1,
  });
  const [busy, setBusy] = useState(false);
  const ladder = LADDERS.find((l) => l.id === fields.ladder);
  const set = (key, value) => setFields((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onSave(fields); onClose(); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-card p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">{initial ? (ar ? "تعديل المسمى الوظيفي" : "Edit job title") : ar ? "مسمى وظيفي جديد" : "New job title"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{ar ? "المسمى الوظيفي *" : "Job title *"}</label>
          <input value={fields.name} onChange={(e) => set("name", e.target.value)} required className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{ar ? "السلم الوظيفي *" : "Ladder *"}</label>
            <select value={fields.ladder} onChange={(e) => { set("ladder", e.target.value); set("grade", ""); }} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              {LADDERS.map((l) => <option key={l.id} value={l.id}>{ar ? l.ar : l.en}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{ar ? "الدرجة / المرتبة" : "Grade"}</label>
            {ladder?.grades.length ? (
              <select value={fields.grade} onChange={(e) => set("grade", e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
                <option value="">{ar ? "اختر…" : "Choose…"}</option>
                {ladder.grades.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <input value={fields.grade} onChange={(e) => set("grade", e.target.value)} placeholder={ar ? "بند الأجور — حرّة" : "Free text"} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{ar ? "وصف المهام" : "Duties description"}</label>
          <textarea value={fields.duties} onChange={(e) => set("duties", e.target.value)} rows={3} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{ar ? "وزن الجهد الافتراضي" : "Default effort weight"}</label>
          <input type="number" min="0.5" step="0.5" value={fields.effortWeight} onChange={(e) => set("effortWeight", Number(e.target.value))} className="w-32 rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={busy || !fields.name.trim()} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50 flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}{ar ? "حفظ المسمى" : "Save title"}
        </button>
      </form>
    </div>
  );
}