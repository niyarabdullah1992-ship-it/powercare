import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

// Employee-facing dispute entry: a reason is mandatory before the dispute opens.
export default function DeductionDisputeForm({ ar, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-body text-destructive hover:bg-destructive/10">
        <AlertTriangle className="h-3 w-3" /> {ar ? "اعتراض على الخصم" : "Dispute deduction"}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
        placeholder={ar ? "سبب الاعتراض (إلزامي)" : "Reason for dispute (required)"}
        className="w-full resize-none rounded-md border border-input px-2.5 py-1.5 text-xs font-body" />
      <div className="flex gap-2">
        <button type="button" disabled={note.trim().length < 5} onClick={() => onSubmit(note.trim())}
          className="rounded-md bg-destructive px-2.5 py-1 text-xs font-body text-destructive-foreground disabled:opacity-50">
          {ar ? "إرسال الاعتراض" : "Submit dispute"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setNote(""); }}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-body hover:bg-muted">
          {ar ? "إلغاء" : "Cancel"}
        </button>
      </div>
    </div>
  );
}