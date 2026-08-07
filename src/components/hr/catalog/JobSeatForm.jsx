import React, { useState } from "react";
import { Loader2, X } from "lucide-react";

export default function JobSeatForm({ initial, titles, stations, employees, onSave, onClose, lang }) {
  const ar = lang === "ar";
  const [fields, setFields] = useState({
    id: initial?.id, titleId: initial?.titleId || "", unitId: initial?.unitId || "",
    managerId: initial?.managerId || "", approvedCount: initial?.approvedCount ?? 1,
  });
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setFields((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onSave({ ...fields, managerId: fields.managerId || null }); onClose(); } finally { setBusy(false); }
  };

  const selects = [
    { key: "titleId", label: ar ? "المسمى الوظيفي *" : "Job title *", options: titles.map((t) => ({ id: t.id, label: `${t.name} (${t.grade || "—"})` })) },
    { key: "unitId", label: ar ? "الوحدة (قسم / دائرة) *" : "Unit (department) *", options: stations.map((s) => ({ id: s.id, label: s.name })) },
    { key: "managerId", label: ar ? "المدير المباشر (مسار الاعتماد)" : "Direct manager (approval path)", options: employees.map((e) => ({ id: e.id, label: e.name })) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-border bg-card p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">{initial ? (ar ? "تعديل المقعد" : "Edit seat") : ar ? "مقعد وظيفي جديد" : "New job seat"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {selects.map((s) => (
          <div key={s.key}>
            <label className="block text-xs text-muted-foreground mb-1">{s.label}</label>
            <select value={fields[s.key]} onChange={(e) => set(s.key, e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">{ar ? "اختر…" : "Choose…"}</option>
              {s.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{ar ? "عدد المقاعد المعتمد *" : "Approved seat count *"}</label>
          <input type="number" min="1" value={fields.approvedCount} onChange={(e) => set("approvedCount", Number(e.target.value))} className="w-32 rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={busy || !fields.titleId || !fields.unitId} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50 flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}{ar ? "حفظ المقعد" : "Save seat"}
        </button>
      </form>
    </div>
  );
}