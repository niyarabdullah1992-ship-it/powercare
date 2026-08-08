import React, { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import PhotoUploader from "@/components/workproof/PhotoUploader";
import FileAttachmentUploader from "@/components/workproof/FileAttachmentUploader";

// Lets the crew add or fix the after-work evidence while the proof is still
// awaiting the client's signature.
export default function AfterEvidenceDialog({ proof, ar, onClose, onSubmit }) {
  const [afterImageUrls, setAfterImageUrls] = useState(proof.afterImageUrls || []);
  const [afterFiles, setAfterFiles] = useState(proof.afterFiles || []);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    await onSubmit({ afterImageUrls, afterFiles });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-elevated sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-border bg-primary px-5 py-4 text-primary-foreground">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-primary-foreground/60 font-body">{proof.proofNumber}</p>
            <h3 className="truncate font-heading text-lg font-semibold">{ar ? "إثبات بعد العمل" : "After-work evidence"}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-primary-foreground/70 hover:bg-white/10" aria-label="close"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-card p-5">
          <PhotoUploader label={ar ? "صور بعد العمل" : "After photos"} urls={afterImageUrls} onChange={setAfterImageUrls} />
          <FileAttachmentUploader label={ar ? "إرفاق ملف بعد العمل" : "Attach file (after)"} files={afterFiles} onChange={setAfterFiles} />
        </div>

        <div className="border-t border-border bg-card px-5 py-4 pb-safe">
          <button type="button" onClick={submit} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {ar ? "حفظ الإثبات" : "Save evidence"}
          </button>
        </div>
      </div>
    </div>
  );
}