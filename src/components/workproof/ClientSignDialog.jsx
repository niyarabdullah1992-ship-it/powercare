import React, { useState } from "react";
import { Check, Loader2, Stamp, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

// The client no longer draws a signature — they attach the site/company stamp image.
export default function ClientSignDialog({ ar, onClose, onSign }) {
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [stampUrl, setStampUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStampUrl(file_url);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const submit = async () => {
    if (!clientName.trim() || !stampUrl || saving) return;
    setSaving(true);
    try {
      await onSign({ clientName: clientName.trim(), clientTitle: clientTitle.trim(), signatureUrl: stampUrl });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">{ar ? "ختم اعتماد العميل" : "Client approval stamp"}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="close"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={ar ? "اسم العميل *" : "Client name *"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <input value={clientTitle} onChange={(e) => setClientTitle(e.target.value)} placeholder={ar ? "الصفة (اختياري)" : "Title (optional)"} className="rounded-md border px-3 py-2 text-sm font-body" />
        </div>
        <p className="text-xs text-muted-foreground font-body">{ar ? "يُرفق ختم الموقع الرسمي لاعتماد استلام العمل بدلاً من التوقيع اليدوي." : "Attach the official site stamp to approve the work instead of a hand-drawn signature."}</p>

        {stampUrl ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-white p-3">
            <Image src={stampUrl} alt="stamp" fittingType="fit" className="h-28 w-40" />
            <button type="button" onClick={() => setStampUrl("")} className="rounded-md border border-border p-2 text-destructive hover:bg-muted" aria-label="remove">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-muted/20 text-sm text-muted-foreground font-body hover:bg-muted/40">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Stamp className="h-6 w-6" />}
            {uploading ? (ar ? "جارٍ الرفع…" : "Uploading…") : (ar ? "إرفاق صورة ختم الموقع" : "Attach site stamp image")}
            <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
          </label>
        )}

        <button type="button" onClick={submit} disabled={!clientName.trim() || !stampUrl || saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? (ar ? "جارٍ الاعتماد…" : "Sealing…") : (ar ? "اعتماد بالختم" : "Approve with stamp")}
        </button>
      </div>
    </div>
  );
}