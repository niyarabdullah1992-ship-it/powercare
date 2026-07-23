import React, { useState } from "react";
import { Check, X } from "lucide-react";

export default function HROrgInlineAdd({ ar, onSave, onCancel }) {
  const [draft, setDraft] = useState({ name: "", position: "" });
  const submit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave({ name: draft.name.trim(), position: draft.position.trim() });
  };
  return <form onSubmit={submit} className="mt-2 space-y-2 rounded-lg border border-accent/50 bg-card p-2.5 shadow-md">
    <input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={ar ? "اسم الموظف" : "Employee name"} className="w-full border px-2 py-1.5 text-xs" />
    <input value={draft.position} onChange={(event) => setDraft({ ...draft, position: event.target.value })} placeholder={ar ? "المنصب" : "Position"} className="w-full border px-2 py-1.5 text-xs" />
    <div className="flex justify-end gap-1.5"><button type="button" onClick={onCancel} className="flex items-center gap-1 border px-2 py-1 text-[10px] text-muted-foreground"><X className="h-3 w-3" />{ar ? "إلغاء" : "Cancel"}</button><button type="submit" className="flex items-center gap-1 bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground"><Check className="h-3 w-3" />{ar ? "حفظ" : "Save"}</button></div>
  </form>;
}