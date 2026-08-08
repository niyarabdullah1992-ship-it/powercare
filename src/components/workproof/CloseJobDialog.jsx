import React, { useState } from "react";
import { CheckCircle2, Loader2, X, CalendarCheck } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-elevated sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-primary px-5 py-4 text-primary-foreground">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-primary-foreground/60 font-body">{proof.proofNumber}</p>
            <h3 className="truncate font-heading text-lg font-semibold">{ar ? "إغلاق المهمة" : "Close job"}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-primary-foreground/70 hover:bg-white/10" aria-label="close"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-card p-5">
          <section className="space-y-2 rounded-lg border border-border bg-muted/25 p-4">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground font-body">
              <CalendarCheck className="h-3.5 w-3.5" />{ar ? "عدد أيام العمل الفعلية" : "Actual working days"}
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={actualDays}
              onChange={(e) => setActualDays(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm font-body"
            />
            {proof.plannedDays != null && (
              <p className="text-[11px] text-muted-foreground font-body">{ar ? "المخطط:" : "Planned:"} {proof.plannedDays}</p>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-border bg-muted/25 p-4">
            <PhotoUploader label={ar ? "صور بعد العمل" : "After photos"} urls={afterImageUrls} onChange={setAfterImageUrls} />
            <FileAttachmentUploader label={ar ? "إرفاق ملف بعد العمل" : "Attach file (after)"} files={afterFiles} onChange={setAfterFiles} />
          </section>
        </div>

        <div className="border-t border-border bg-card px-5 py-4 pb-safe">
          <button
            type="button"
            onClick={submit}
            disabled={actualDays === "" || saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {ar ? "إغلاق وإرسال لتوقيع العميل" : "Close & send for client signature"}
          </button>
        </div>
      </div>
    </div>
  );
}