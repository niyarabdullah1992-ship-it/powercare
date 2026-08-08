import React, { useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import PhotoUploader from "@/components/workproof/PhotoUploader";
import FileAttachmentUploader from "@/components/workproof/FileAttachmentUploader";

// Closing a job records the ACTUAL working days and the after-photos,
// then moves the record to "awaiting client signature".
export default function CloseJobDialog({ proof, ar, onClose, onSubmit }) {
  const [actualDays, setActualDays] = useState(proof.plannedDays != null ? String(proof.plannedDays) : "");
  const [afterImageUrls, setAfterImageUrls] = useState(proof.afterImageUrls || []);
  const [afterFiles, setAfterFiles] = useState(proof.afterFiles || []);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (actualDays === "" || saving) return;
    setSaving(true);
    await onSubmit({ actualDays: Number(actualDays), afterImageUrls, afterFiles });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">{ar ? "إغلاق المهمة" : "Close job"}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="close"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground font-body">{ar ? "عدد أيام العمل الفعلية" : "Actual working days"}</label>
          <input type="number" min="0" step="0.5" value={actualDays} onChange={(e) => setActualDays(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm font-body" />
          {proof.plannedDays != null && (
            <p className="text-[11px] text-muted-foreground font-body">{ar ? "المخطط:" : "Planned:"} {proof.plannedDays}</p>
          )}
        </div>
        <PhotoUploader label={ar ? "صور بعد العمل" : "After photos"} urls={afterImageUrls} onChange={setAfterImageUrls} />
        <FileAttachmentUploader label={ar ? "إرفاق ملف بعد العمل" : "Attach file (after)"} files={afterFiles} onChange={setAfterFiles} />
        <button type="button" onClick={submit} disabled={actualDays === "" || saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {ar ? "إغلاق وإرسال لتوقيع العميل" : "Close & send for client signature"}
        </button>
      </div>
    </div>
  );
}